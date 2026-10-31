import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { normalizeNid, computeNidHmac } from '../../common/utils/nid.util';
import { buildNidMatchWhere } from './helpers/nid-match.helper';

export interface FileMetadata {
  fileName: string;
  fileType: string;
  sizeBytes: number | null;
  existsOnDisk: boolean;
  fileRef: string | null;
  status: string;
  uploadedAt: string | null;
  serveUrl: string | null;
  /** Internal-API-key-accessible URL for this file via GET /api/internal/files/:kind/:id */
  internalFileUrl: string | null;
}

export type NidLookupResponse =
  | { match: false }
  | {
      match: true;
      profile: Record<string, any>;
    };

@Injectable()
export class NidLookupService implements OnModuleInit {
  private readonly logger = new Logger(NidLookupService.name);

  /** Set to true only when both required env keys are present. */
  private enabled = false;
  private hmacKey: string | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  onModuleInit(): void {
    const apiKey = this.config.get<string>('INTERNAL_API_KEY');
    const hmacKey = this.config.get<string>('NID_HMAC_KEY');

    if (!apiKey) {
      this.logger.error(
        '[NidLookup] CRITICAL: INTERNAL_API_KEY is not configured — ' +
          'POST /api/internal/nid-lookup will reject all requests.',
      );
    }
    if (!hmacKey) {
      this.logger.error(
        '[NidLookup] CRITICAL: NID_HMAC_KEY is not configured — ' +
          'POST /api/internal/nid-lookup will always return { match: false }.',
      );
    }

    if (apiKey && hmacKey) {
      this.hmacKey = hmacKey;
      this.enabled = true;
      this.logger.log('[NidLookup] Endpoint is enabled and ready.');
    }
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  async lookup(
    normalizedNid: string,
    dob: string,
    callerIp: string,
  ): Promise<NidLookupResponse> {
    const masked = this.maskNid(normalizedNid);

    if (!this.enabled) {
      // Fail closed — NID_HMAC_KEY missing; do dummy work to avoid fast-path timing leak
      await this.dummyWork(normalizedNid);
      this.logger.error(
        `[NidLookup] ${new Date().toISOString()} | ip=${callerIp} | nid=${masked} | match=false [DISABLED — missing env key]`,
      );
      return { match: false };
    }

    const normalized = normalizeNid(normalizedNid);
    if (!normalized) {
      await this.dummyWork(normalizedNid);
      this.logger.warn(
        `[NidLookup] ${new Date().toISOString()} | ip=${callerIp} | nid=${masked} | match=false [INVALID NID FORMAT]`,
      );
      return { match: false };
    }

    const nidHash = computeNidHmac(normalized, this.hmacKey!);

    // Single comprehensive ORM query fetching the verified user and all reachable relations.
    // Secrets (passwords, MFA secrets/backup codes, tokens, session tables, nid_hash) are excluded.
    const record = await this.prisma.customerRegistration.findFirst({
      where: buildNidMatchWhere(nidHash, dob),
      include: {
        user: {
          include: {
            profile: true,
            security: true,
            mfa_methods: {
              select: {
                id: true,
                user_id: true,
                type: true,
                is_enabled: true,
                tenant_id: true,
                created_at: true,
                updated_at: true,
              },
              orderBy: { created_at: 'desc' },
            },
            identity_verifications: {
              orderBy: { created_at: 'desc' },
              include: {
                documents: {
                  orderBy: { created_at: 'desc' },
                  include: {
                    document_type: true,
                    ocr_results: {
                      orderBy: { created_at: 'desc' },
                    },
                  },
                },
                face_verifications: {
                  orderBy: { created_at: 'desc' },
                },
                liveness_verifications: {
                  orderBy: { created_at: 'desc' },
                },
                results: {
                  orderBy: { created_at: 'desc' },
                },
                business_verifications: {
                  orderBy: { created_at: 'desc' },
                  include: {
                    results: {
                      orderBy: { created_at: 'desc' },
                    },
                  },
                },
              },
            },
            verification_attempts: {
              orderBy: { created_at: 'desc' },
            },
            business_memberships: {
              orderBy: { created_at: 'desc' },
              include: {
                business: {
                  include: {
                    documents: {
                      orderBy: { created_at: 'desc' },
                      include: {
                        document_type: true,
                      },
                    },
                    verifications: {
                      orderBy: { created_at: 'desc' },
                      include: {
                        results: {
                          orderBy: { created_at: 'desc' },
                        },
                      },
                    },
                    members: {
                      orderBy: { created_at: 'desc' },
                      include: {
                        user: {
                          select: {
                            id: true,
                            email: true,
                            status: true,
                            profile: {
                              select: {
                                first_name: true,
                                last_name: true,
                                phone_number: true,
                                country_code: true,
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            support_tickets: {
              orderBy: { created_at: 'desc' },
              include: {
                messages: {
                  orderBy: { created_at: 'asc' },
                  include: {
                    attachments: true,
                  },
                },
                attachments: true,
                email_change_req: {
                  select: {
                    id: true,
                    user_id: true,
                    ticket_id: true,
                    old_email: true,
                    new_email: true,
                    status: true,
                    token_expires_at: true,
                    rejection_reason: true,
                    approved_by: true,
                    created_at: true,
                    updated_at: true,
                  },
                },
              },
            },
            email_change_requests: {
              orderBy: { created_at: 'desc' },
              select: {
                id: true,
                user_id: true,
                ticket_id: true,
                old_email: true,
                new_email: true,
                status: true,
                token_expires_at: true,
                rejection_reason: true,
                approved_by: true,
                created_at: true,
                updated_at: true,
              },
            },
            oauth_authorizations: {
              orderBy: { created_at: 'desc' },
              include: {
                client: {
                  select: {
                    id: true,
                    client_id: true,
                    name: true,
                    description: true,
                    logo_uri: true,
                    redirect_uris: true,
                    allowed_scopes: true,
                    required_verification_level: true,
                    status: true,
                    created_at: true,
                    updated_at: true,
                  },
                },
              },
            },
            owned_tenants: {
              orderBy: { created_at: 'desc' },
              include: {
                subscriptions: {
                  orderBy: { created_at: 'desc' },
                  include: {
                    plan: true,
                    invoices: {
                      orderBy: { created_at: 'desc' },
                      include: {
                        payments: {
                          orderBy: { created_at: 'desc' },
                        },
                      },
                    },
                  },
                },
                usages: {
                  orderBy: { period_start: 'desc' },
                },
                members: {
                  orderBy: { created_at: 'desc' },
                  include: {
                    user: {
                      select: {
                        id: true,
                        email: true,
                        status: true,
                        profile: {
                          select: {
                            first_name: true,
                            last_name: true,
                            phone_number: true,
                            country_code: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            tenant_memberships: {
              orderBy: { created_at: 'desc' },
              include: {
                tenant: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                    business_id: true,
                    status: true,
                    custom_domain: true,
                    logo_url: true,
                    brand_color: true,
                    settings: true,
                    created_at: true,
                    updated_at: true,
                  },
                },
              },
            },
            audit_logs: {
              orderBy: { created_at: 'desc' },
              take: 100,
            },
          },
        },
      },
    });

    const match = record !== null;

    if (!match) {
      // Timing equalisation: when no record found, perform equivalent CPU/IO work
      await this.dummyWork(normalized);
      this.logger.log(
        `[NidLookup] ${new Date().toISOString()} | ip=${callerIp} | nid=${masked} | match=false`,
      );
      return { match: false };
    }

    // Build the complete, grouped, JSON-safe user profile
    const profile = this.buildProfile(record);

    this.logger.log(
      `[NidLookup] ${new Date().toISOString()} | ip=${callerIp} | nid=${masked} | match=true`,
    );

    return {
      match: true,
      profile,
    };
  }

  // ── Profile Builder ────────────────────────────────────────────────────────

  private buildProfile(record: any): Record<string, any> {
    const user = record.user || {};
    const profile = user.profile || null;
    const security = user.security || null;

    // Build customerRegistration object excluding blind index columns
    const customerRegistration = {
      id: record.id,
      user_id: record.user_id,
      customer_type: record.customer_type,
      company_name: record.company_name,
      authorized_person_name: record.authorized_person_name,
      company_position: record.company_position,
      full_name: record.full_name,
      nid_passport_number: record.nid_passport_number,
      phone_number: record.phone_number,
      email: record.email,
      date_of_birth: record.date_of_birth,
      gender: record.gender,
      present_street: record.present_street,
      present_city: record.present_city,
      present_postal_code: record.present_postal_code,
      present_country: record.present_country,
      same_as_present_address: record.same_as_present_address,
      permanent_street: record.permanent_street,
      permanent_city: record.permanent_city,
      permanent_postal_code: record.permanent_postal_code,
      permanent_country: record.permanent_country,
      father_name: record.father_name,
      mother_name: record.mother_name,
      contact_phone: record.contact_phone,
      contact_email: record.contact_email,
      declaration_confirmed: record.declaration_confirmed,
      declaration_confirmed_at: record.declaration_confirmed_at,
      tenant_id: record.tenant_id,
      created_at: record.created_at,
      updated_at: record.updated_at,
    };

    // Personal details collected during initial account signup & registration form
    const personalDetails = {
      fullName: record.full_name,
      firstName: profile?.first_name || record.full_name.split(' ')[0] || null,
      lastName:
        profile?.last_name ||
        record.full_name.split(' ').slice(1).join(' ') ||
        null,
      nidPassportNumber: record.nid_passport_number,
      dateOfBirth: record.date_of_birth,
      gender: record.gender,
      phoneNumber: record.phone_number,
      profilePhoneNumber: profile?.phone_number || null,
      email: record.email,
      accountEmail: user.email || null,
      countryCode: profile?.country_code || null,
      fatherName: record.father_name,
      motherName: record.mother_name,
      contactPhone: record.contact_phone,
      contactEmail: record.contact_email,
      presentAddress: {
        street: record.present_street,
        city: record.present_city,
        postalCode: record.present_postal_code,
        country: record.present_country,
      },
      permanentAddress: {
        sameAsPresentAddress: record.same_as_present_address,
        street: record.permanent_street,
        city: record.permanent_city,
        postalCode: record.permanent_postal_code,
        country: record.permanent_country,
      },
      customerType: record.customer_type,
      company:
        record.customer_type === 'COMPANY' || record.company_name
          ? {
              companyName: record.company_name,
              authorizedPersonName: record.authorized_person_name,
              companyPosition: record.company_position,
            }
          : null,
      declaration: {
        confirmed: record.declaration_confirmed,
        confirmedAt: record.declaration_confirmed_at,
      },
    };

    // Account details (password_hash excluded)
    const account = {
      id: user.id,
      email: user.email,
      status: user.status,
      email_verified: user.email_verified,
      email_verified_at: user.email_verified_at,
      customer_registration_completed: user.customer_registration_completed,
      tenant_id: user.tenant_id,
      created_at: user.created_at,
      updated_at: user.updated_at,
      profile: profile
        ? {
            id: profile.id,
            user_id: profile.user_id,
            first_name: profile.first_name,
            last_name: profile.last_name,
            country_code: profile.country_code,
            phone_number: profile.phone_number,
            tenant_id: profile.tenant_id,
            created_at: profile.created_at,
            updated_at: profile.updated_at,
          }
        : null,
      security: security
        ? {
            id: security.id,
            user_id: security.user_id,
            failed_login_attempts: security.failed_login_attempts,
            locked_until: security.locked_until,
            last_password_change: security.last_password_change,
            tenant_id: security.tenant_id,
            created_at: security.created_at,
            updated_at: security.updated_at,
          }
        : null,
      mfa_methods: (user.mfa_methods || []).map((m: any) => ({
        id: m.id,
        user_id: m.user_id,
        type: m.type,
        is_enabled: m.is_enabled,
        tenant_id: m.tenant_id,
        created_at: m.created_at,
        updated_at: m.updated_at,
      })),
    };

    // All KYC verifications, documents, faces, liveness, and results
    const rawVerifications = user.identity_verifications || [];
    const allKycDocuments: any[] = [];

    const kycVerifications = rawVerifications.map((v: any) => {
      const documents = (v.documents || []).map((doc: any) => {
        const frontImage = this.getFileMetadata(doc.front_image_path, {
          status: doc.status,
          uploadedAt: doc.created_at,
          serveUrl: `/api/admin/kyc/documents/${doc.id}/file/front`,
          internalFileUrl: `/api/internal/files/document-front/${doc.id}`,
        });

        const backImage = doc.back_image_path
          ? this.getFileMetadata(doc.back_image_path, {
              status: doc.status,
              uploadedAt: doc.created_at,
              serveUrl: `/api/admin/kyc/documents/${doc.id}/file/back`,
              internalFileUrl: `/api/internal/files/document-back/${doc.id}`,
            })
          : null;

        const docPayload = {
          id: doc.id,
          verification_id: doc.verification_id,
          document_type_id: doc.document_type_id,
          document_type: doc.document_type
            ? {
                id: doc.document_type.id,
                code: doc.document_type.code,
                name: doc.document_type.name,
                description: doc.document_type.description,
                created_at: doc.document_type.created_at,
                updated_at: doc.document_type.updated_at,
              }
            : null,
          country_code: doc.country_code,
          document_hash: doc.document_hash,
          status: doc.status,
          tenant_id: doc.tenant_id,
          created_at: doc.created_at,
          updated_at: doc.updated_at,
          front_image: frontImage,
          back_image: backImage,
          ocr_results: (doc.ocr_results || []).map((ocr: any) => ({
            id: ocr.id,
            document_id: ocr.document_id,
            raw_text: ocr.raw_text,
            first_name: ocr.first_name,
            last_name: ocr.last_name,
            full_name: ocr.full_name,
            document_number: ocr.document_number,
            date_of_birth: ocr.date_of_birth,
            issue_date: ocr.issue_date,
            expiry_date: ocr.expiry_date,
            nationality: ocr.nationality,
            gender: ocr.gender,
            address: ocr.address,
            mrz_data: ocr.mrz_data,
            confidence_score: ocr.confidence_score,
            field_confidences: ocr.field_confidences,
            tenant_id: ocr.tenant_id,
            created_at: ocr.created_at,
          })),
        };

        allKycDocuments.push(docPayload);
        return docPayload;
      });

      const faceVerifications = (v.face_verifications || []).map((fv: any) => {
        const portraitImage = fv.portrait_image_path
          ? this.getFileMetadata(fv.portrait_image_path, {
              uploadedAt: fv.created_at,
              serveUrl: `/api/admin/kyc/${v.id}/face/portrait`,
              internalFileUrl: `/api/internal/files/face-portrait/${fv.id}`,
            })
          : null;

        const liveFaceImage = fv.live_face_image_path
          ? this.getFileMetadata(fv.live_face_image_path, {
              uploadedAt: fv.created_at,
              serveUrl: `/api/admin/kyc/${v.id}/face/live`,
              internalFileUrl: `/api/internal/files/face-live/${fv.id}`,
            })
          : null;

        return {
          id: fv.id,
          verification_id: fv.verification_id,
          match_score: fv.match_score,
          is_matched: fv.is_matched,
          quality_metrics: fv.quality_metrics,
          tenant_id: fv.tenant_id,
          created_at: fv.created_at,
          portrait_image: portraitImage,
          live_face_image: liveFaceImage,
        };
      });

      const livenessVerifications = (v.liveness_verifications || []).map(
        (lv: any) => ({
          id: lv.id,
          verification_id: lv.verification_id,
          challenge_type: lv.challenge_type,
          challenge_token: lv.challenge_token,
          is_active_passed: lv.is_active_passed,
          passive_liveness_score: lv.passive_liveness_score,
          is_live: lv.is_live,
          tenant_id: lv.tenant_id,
          created_at: lv.created_at,
        }),
      );

      const results = (v.results || []).map((r: any) => ({
        id: r.id,
        verification_id: r.verification_id,
        decision: r.decision,
        scores: r.scores,
        summary: r.summary,
        reviewer_notes: r.reviewer_notes,
        reviewed_by: r.reviewed_by,
        tenant_id: r.tenant_id,
        created_at: r.created_at,
      }));

      const linkedBusinessVerifications = (
        v.business_verifications || []
      ).map((bv: any) => ({
        id: bv.id,
        business_id: bv.business_id,
        decision: bv.decision,
        score: bv.score,
        notes: bv.notes,
        tenant_id: bv.tenant_id,
        created_at: bv.created_at,
        updated_at: bv.updated_at,
        results: (bv.results || []).map((bvr: any) => ({
          id: bvr.id,
          rules_evaluated: bvr.rules_evaluated,
          tenant_id: bvr.tenant_id,
          created_at: bvr.created_at,
        })),
      }));

      return {
        id: v.id,
        user_id: v.user_id,
        status: v.status,
        verification_level: v.verification_level,
        current_step: v.current_step,
        rejection_reasons: v.rejection_reasons,
        tenant_id: v.tenant_id,
        created_at: v.created_at,
        updated_at: v.updated_at,
        documents,
        face_verifications: faceVerifications,
        liveness_verifications: livenessVerifications,
        results,
        linked_business_verifications: linkedBusinessVerifications,
      };
    });

    const verificationAttempts = (user.verification_attempts || []).map(
      (va: any) => ({
        id: va.id,
        user_id: va.user_id,
        attempt_number: va.attempt_number,
        ip_address: va.ip_address,
        user_agent: va.user_agent,
        tenant_id: va.tenant_id,
        created_at: va.created_at,
      }),
    );

    // KYB: business memberships, businesses, business documents, and business verifications
    const rawMemberships = user.business_memberships || [];
    const allBusinesses: any[] = [];
    const allBusinessVerifications: any[] = [];

    const kybMemberships = rawMemberships.map((bm: any) => {
      const b = bm.business || {};

      const businessDocuments = (b.documents || []).map((bdoc: any) => ({
        id: bdoc.id,
        business_id: bdoc.business_id,
        document_type_id: bdoc.document_type_id,
        document_type: bdoc.document_type
          ? {
              id: bdoc.document_type.id,
              code: bdoc.document_type.code,
              name: bdoc.document_type.name,
              description: bdoc.document_type.description,
            }
          : null,
        file_name: bdoc.file_name,
        file_type: bdoc.file_type,
        ocr_data: bdoc.ocr_data,
        status: bdoc.status,
        tenant_id: bdoc.tenant_id,
        created_at: bdoc.created_at,
        updated_at: bdoc.updated_at,
        file: this.getFileMetadata(bdoc.file_path, {
          fileName: bdoc.file_name,
          mimeType: bdoc.file_type,
          status: bdoc.status,
          uploadedAt: bdoc.created_at,
        }),
      }));

      const businessVerifications = (b.verifications || []).map(
        (bver: any) => {
          const verPayload = {
            id: bver.id,
            business_id: bver.business_id,
            owner_kyc_id: bver.owner_kyc_id,
            decision: bver.decision,
            score: bver.score,
            notes: bver.notes,
            tenant_id: bver.tenant_id,
            created_at: bver.created_at,
            updated_at: bver.updated_at,
            results: (bver.results || []).map((bvr: any) => ({
              id: bvr.id,
              business_verification_id: bvr.business_verification_id,
              rules_evaluated: bvr.rules_evaluated,
              tenant_id: bvr.tenant_id,
              created_at: bvr.created_at,
            })),
          };
          allBusinessVerifications.push(verPayload);
          return verPayload;
        },
      );

      const businessMembers = (b.members || []).map((m: any) => ({
        id: m.id,
        business_id: m.business_id,
        user_id: m.user_id,
        role: m.role,
        is_primary_contact: m.is_primary_contact,
        tenant_id: m.tenant_id,
        created_at: m.created_at,
        user: m.user
          ? {
              id: m.user.id,
              email: m.user.email,
              status: m.user.status,
              profile: m.user.profile
                ? {
                    first_name: m.user.profile.first_name,
                    last_name: m.user.profile.last_name,
                    phone_number: m.user.profile.phone_number,
                    country_code: m.user.profile.country_code,
                  }
                : null,
            }
          : null,
      }));

      const businessObj = {
        id: b.id,
        legal_name: b.legal_name,
        trade_name: b.trade_name,
        business_type: b.business_type,
        country_code: b.country_code,
        address: b.address,
        business_email: b.business_email,
        website: b.website,
        trade_license_number: b.trade_license_number,
        license_issue_date: b.license_issue_date,
        license_expiry_date: b.license_expiry_date,
        issuing_authority: b.issuing_authority,
        description: b.description,
        status: b.status,
        verification_level: b.verification_level,
        user_role_in_business: bm.role,
        is_user_primary_contact: bm.is_primary_contact,
        tenant_id: b.tenant_id,
        created_at: b.created_at,
        updated_at: b.updated_at,
        members: businessMembers,
        documents: businessDocuments,
        verifications: businessVerifications,
      };

      allBusinesses.push(businessObj);

      return {
        id: bm.id,
        business_id: bm.business_id,
        user_id: bm.user_id,
        role: bm.role,
        is_primary_contact: bm.is_primary_contact,
        tenant_id: bm.tenant_id,
        created_at: bm.created_at,
        updated_at: bm.updated_at,
        business: {
          id: b.id,
          legal_name: b.legal_name,
          trade_name: b.trade_name,
          business_type: b.business_type,
          country_code: b.country_code,
          address: b.address,
          business_email: b.business_email,
          website: b.website,
          trade_license_number: b.trade_license_number,
          license_issue_date: b.license_issue_date,
          license_expiry_date: b.license_expiry_date,
          issuing_authority: b.issuing_authority,
          status: b.status,
          verification_level: b.verification_level,
          created_at: b.created_at,
          updated_at: b.updated_at,
        },
      };
    });

    // Support tickets, messages, attachments, and email change requests
    const supportTickets = (user.support_tickets || []).map((ticket: any) => ({
      id: ticket.id,
      user_id: ticket.user_id,
      category: ticket.category,
      subject: ticket.subject,
      description: ticket.description,
      status: ticket.status,
      priority: ticket.priority,
      assigned_admin: ticket.assigned_admin,
      closed_at: ticket.closed_at,
      created_at: ticket.created_at,
      updated_at: ticket.updated_at,
      messages: (ticket.messages || []).map((msg: any) => ({
        id: msg.id,
        ticket_id: msg.ticket_id,
        sender_id: msg.sender_id,
        sender_type: msg.sender_type,
        message: msg.message,
        created_at: msg.created_at,
        attachments: (msg.attachments || []).map((att: any) => ({
          id: att.id,
          file_name: att.file_name,
          file_size: att.file_size,
          mime_type: att.mime_type,
          created_at: att.created_at,
          file: this.getFileMetadata(att.file_path, {
            fileName: att.file_name,
            mimeType: att.mime_type,
            fileSize: att.file_size,
            uploadedAt: att.created_at,
          }),
        })),
      })),
      attachments: (ticket.attachments || []).map((att: any) => ({
        id: att.id,
        file_name: att.file_name,
        file_size: att.file_size,
        mime_type: att.mime_type,
        created_at: att.created_at,
        file: this.getFileMetadata(att.file_path, {
          fileName: att.file_name,
          mimeType: att.mime_type,
          fileSize: att.file_size,
          uploadedAt: att.created_at,
        }),
      })),
      email_change_request: ticket.email_change_req
        ? {
            id: ticket.email_change_req.id,
            user_id: ticket.email_change_req.user_id,
            ticket_id: ticket.email_change_req.ticket_id,
            old_email: ticket.email_change_req.old_email,
            new_email: ticket.email_change_req.new_email,
            status: ticket.email_change_req.status,
            token_expires_at: ticket.email_change_req.token_expires_at,
            rejection_reason: ticket.email_change_req.rejection_reason,
            approved_by: ticket.email_change_req.approved_by,
            created_at: ticket.email_change_req.created_at,
            updated_at: ticket.email_change_req.updated_at,
          }
        : null,
    }));

    const emailChangeRequests = (user.email_change_requests || []).map(
      (ecr: any) => ({
        id: ecr.id,
        user_id: ecr.user_id,
        ticket_id: ecr.ticket_id,
        old_email: ecr.old_email,
        new_email: ecr.new_email,
        status: ecr.status,
        token_expires_at: ecr.token_expires_at,
        rejection_reason: ecr.rejection_reason,
        approved_by: ecr.approved_by,
        created_at: ecr.created_at,
        updated_at: ecr.updated_at,
      }),
    );

    // OAuth connected applications (client secrets excluded)
    const connectedApplications = (user.oauth_authorizations || []).map(
      (ca: any) => ({
        id: ca.id,
        user_id: ca.user_id,
        client_id: ca.client_id,
        granted_scopes: ca.granted_scopes,
        is_revoked: ca.is_revoked,
        created_at: ca.created_at,
        updated_at: ca.updated_at,
        client: ca.client
          ? {
              id: ca.client.id,
              client_id: ca.client.client_id,
              name: ca.client.name,
              description: ca.client.description,
              logo_uri: ca.client.logo_uri,
              redirect_uris: ca.client.redirect_uris,
              allowed_scopes: ca.client.allowed_scopes,
              required_verification_level:
                ca.client.required_verification_level,
              status: ca.client.status,
              created_at: ca.client.created_at,
              updated_at: ca.client.updated_at,
            }
          : null,
      }),
    );

    // Tenancy: Owned tenants, subscriptions, invoices, payments, usages, and memberships
    const ownedTenants = (user.owned_tenants || []).map((t: any) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      business_id: t.business_id,
      status: t.status,
      custom_domain: t.custom_domain,
      logo_url: t.logo_url,
      brand_color: t.brand_color,
      settings: t.settings,
      created_at: t.created_at,
      updated_at: t.updated_at,
      subscriptions: (t.subscriptions || []).map((s: any) => ({
        id: s.id,
        tenant_id: s.tenant_id,
        plan_id: s.plan_id,
        status: s.status,
        billing_cycle: s.billing_cycle,
        current_period_start: s.current_period_start,
        current_period_end: s.current_period_end,
        trial_ends_at: s.trial_ends_at,
        cancel_at_period_end: s.cancel_at_period_end,
        created_at: s.created_at,
        updated_at: s.updated_at,
        plan: s.plan
          ? {
              id: s.plan.id,
              code: s.plan.code,
              name: s.plan.name,
              description: s.plan.description,
              price_monthly: s.plan.price_monthly,
              price_yearly: s.plan.price_yearly,
              currency: s.plan.currency,
              max_users: s.plan.max_users,
              max_kyc_monthly: s.plan.max_kyc_monthly,
              max_kyb_monthly: s.plan.max_kyb_monthly,
              max_api_calls_monthly: s.plan.max_api_calls_monthly,
              max_connected_apps: s.plan.max_connected_apps,
              storage_mb: s.plan.storage_mb,
              features: s.plan.features,
              is_active: s.plan.is_active,
              created_at: s.plan.created_at,
            }
          : null,
        invoices: (s.invoices || []).map((inv: any) => ({
          id: inv.id,
          invoice_number: inv.invoice_number,
          tenant_id: inv.tenant_id,
          subscription_id: inv.subscription_id,
          amount: inv.amount,
          currency: inv.currency,
          status: inv.status,
          billing_reason: inv.billing_reason,
          line_items: inv.line_items,
          pdf_url: inv.pdf_url,
          due_date: inv.due_date,
          paid_at: inv.paid_at,
          created_at: inv.created_at,
          payments: (inv.payments || []).map((p: any) => ({
            id: p.id,
            invoice_id: p.invoice_id,
            amount: p.amount,
            currency: p.currency,
            status: p.status,
            payment_method: p.payment_method,
            provider: p.provider,
            transaction_id: p.transaction_id,
            receipt_url: p.receipt_url,
            created_at: p.created_at,
          })),
        })),
      })),
      usages: (t.usages || []).map((u: any) => ({
        id: u.id,
        tenant_id: u.tenant_id,
        metric: u.metric,
        count: u.count,
        period_start: u.period_start,
        period_end: u.period_end,
        updated_at: u.updated_at,
      })),
      members: (t.members || []).map((tm: any) => ({
        id: tm.id,
        tenant_id: tm.tenant_id,
        user_id: tm.user_id,
        role: tm.role,
        permissions: tm.permissions,
        created_at: tm.created_at,
        user: tm.user
          ? {
              id: tm.user.id,
              email: tm.user.email,
              status: tm.user.status,
              profile: tm.user.profile
                ? {
                    first_name: tm.user.profile.first_name,
                    last_name: tm.user.profile.last_name,
                    phone_number: tm.user.profile.phone_number,
                    country_code: tm.user.profile.country_code,
                  }
                : null,
            }
          : null,
      })),
    }));

    const tenantMemberships = (user.tenant_memberships || []).map(
      (tm: any) => ({
        id: tm.id,
        tenant_id: tm.tenant_id,
        user_id: tm.user_id,
        role: tm.role,
        permissions: tm.permissions,
        created_at: tm.created_at,
        updated_at: tm.updated_at,
        tenant: tm.tenant
          ? {
              id: tm.tenant.id,
              name: tm.tenant.name,
              slug: tm.tenant.slug,
              business_id: tm.tenant.business_id,
              status: tm.tenant.status,
              custom_domain: tm.tenant.custom_domain,
              logo_url: tm.tenant.logo_url,
              brand_color: tm.tenant.brand_color,
              settings: tm.tenant.settings,
              created_at: tm.tenant.created_at,
              updated_at: tm.tenant.updated_at,
            }
          : null,
      }),
    );

    const auditLogs = (user.audit_logs || []).map((al: any) => ({
      id: al.id,
      user_id: al.user_id,
      event_type: al.event_type,
      ip_address: al.ip_address,
      user_agent: al.user_agent,
      metadata: al.metadata,
      tenant_id: al.tenant_id,
      created_at: al.created_at,
    }));

    // ── primaryImages ────────────────────────────────────────────────────────
    // Pick the most recent VERIFIED IdentityVerification for this user.
    // We chose VERIFIED (not any status) because the consumer needs confirmed
    // identity images — a PENDING or REJECTED verification should not be used.
    //
    // livePhoto  : the live selfie captured during registration (face-live);
    //              falls back to face-portrait if live is absent.
    // idDocument : front image of the most recent document in that verification.
    //
    // If the user is KYB-only (no personal KYC at all) both fields are null.
    const verifiedKyc = rawVerifications.find((v: any) => v.status === 'VERIFIED');

    let primaryImages: {
      livePhoto: { kind: string; id: string; mimeType: string | null; sizeBytes: number | null } | null;
      idDocument: { kind: string; id: string; mimeType: string | null; sizeBytes: number | null } | null;
    } = { livePhoto: null, idDocument: null };

    if (verifiedKyc) {
      // livePhoto: first face_verification that has a live or portrait image
      const fvRecord = (verifiedKyc.face_verifications || [])[0] as any;
      if (fvRecord) {
        if (fvRecord.live_face_image_path) {
          const fvBuilt = (verifiedKyc.face_verifications
            ? kycVerifications
                .find((kv: any) => kv.id === verifiedKyc.id)
                ?.face_verifications?.find((fv: any) => fv.id === fvRecord.id)
            : null);
          primaryImages.livePhoto = {
            kind: 'face-live',
            id: fvRecord.id,
            mimeType: fvBuilt?.live_face_image?.fileType ?? null,
            sizeBytes: fvBuilt?.live_face_image?.sizeBytes ?? null,
          };
        } else if (fvRecord.portrait_image_path) {
          primaryImages.livePhoto = {
            kind: 'face-portrait',
            id: fvRecord.id,
            mimeType: null,
            sizeBytes: null,
          };
        }
      }

      // idDocument: front image of the first (most recent) document
      const docRecord = (verifiedKyc.documents || [])[0] as any;
      if (docRecord && docRecord.front_image_path) {
        const docBuilt = kycVerifications
          .find((kv: any) => kv.id === verifiedKyc.id)
          ?.documents?.find((d: any) => d.id === docRecord.id);
        primaryImages.idDocument = {
          kind: 'document-front',
          id: docRecord.id,
          mimeType: docBuilt?.front_image?.fileType ?? null,
          sizeBytes: docBuilt?.front_image?.sizeBytes ?? null,
        };
      }
    }

    const rawResult = {
      primaryImages,
      account,
      personalDetails,
      customerRegistration,
      kyc: {
        verifications: kycVerifications,
        documents: allKycDocuments,
        attempts: verificationAttempts,
      },
      kyb: {
        memberships: kybMemberships,
        businesses: allBusinesses,
        verifications: allBusinessVerifications,
      },
      support: {
        tickets: supportTickets,
        emailChangeRequests,
      },
      oauth: {
        connectedApplications,
      },
      tenancy: {
        ownedTenants,
        memberships: tenantMemberships,
      },
      auditLogs,
    };

    return this.makeJsonSafe(rawResult);
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  /**
   * Recursively ensures Dates are ISO strings, BigInts and Decimals are strings.
   */
  private makeJsonSafe(data: any): any {
    if (data === null || data === undefined) {
      return data;
    }
    if (typeof data === 'bigint') {
      return data.toString();
    }
    if (data instanceof Date) {
      return data.toISOString();
    }
    if (
      typeof data === 'object' &&
      data !== null &&
      (typeof data.toFixed === 'function' ||
        (data.constructor && data.constructor.name === 'Decimal') ||
        ('d' in data && 'e' in data && 's' in data))
    ) {
      return data.toString();
    }
    if (Array.isArray(data)) {
      return data.map((item) => this.makeJsonSafe(item));
    }
    if (typeof data === 'object') {
      const result: Record<string, any> = {};
      for (const [key, value] of Object.entries(data)) {
        result[key] = this.makeJsonSafe(value);
      }
      return result;
    }
    return data;
  }

  /**
   * Safely returns disk and serving metadata for uploaded files without inlining binary.
   */
  private getFileMetadata(
    filePath: string | null | undefined,
    fallback: {
      fileName?: string;
      mimeType?: string;
      fileSize?: number;
      status?: string;
      uploadedAt?: Date | string | null;
      serveUrl?: string | null;
      internalFileUrl?: string | null;
    } = {},
  ): FileMetadata | null {
    if (!filePath) {
      return null;
    }

    const fileName = fallback.fileName || path.basename(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const mimeMap: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.pdf': 'application/pdf',
    };
    const mimeType =
      fallback.mimeType || mimeMap[ext] || 'application/octet-stream';

    let exists = false;
    let sizeBytes: number | null = fallback.fileSize ?? null;
    try {
      if (fs.existsSync(filePath)) {
        exists = true;
        const stat = fs.statSync(filePath);
        sizeBytes = stat.size;
      }
    } catch {
      // Non-fatal filesystem access error
    }

    let fileRef: string | null = filePath;
    try {
      if (path.isAbsolute(filePath)) {
        fileRef = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
      }
    } catch {
      // ignore
    }

    return {
      fileName,
      fileType: mimeType,
      sizeBytes,
      existsOnDisk: exists,
      fileRef,
      status: fallback.status || (exists ? 'AVAILABLE' : 'RECORDED'),
      uploadedAt:
        fallback.uploadedAt instanceof Date
          ? fallback.uploadedAt.toISOString()
          : fallback.uploadedAt || null,
      serveUrl: fallback.serveUrl || null,
      internalFileUrl: fallback.internalFileUrl || null,
    };
  }

  /**
   * Performs work equivalent to a real lookup so that response latency
   * does not reveal whether a NID exists in the database.
   */
  private async dummyWork(normalizedNid: string): Promise<void> {
    if (this.hmacKey) {
      crypto.createHmac('sha256', this.hmacKey).update(normalizedNid).digest('hex');
    }
    await new Promise<void>((resolve) =>
      setTimeout(resolve, 5 + Math.random() * 10),
    );
  }

  private maskNid(nid: string): string {
    if (!nid || nid.length < 4) return '**';
    return `${nid.slice(0, 2)}${'*'.repeat(nid.length - 4)}${nid.slice(-2)}`;
  }
}
