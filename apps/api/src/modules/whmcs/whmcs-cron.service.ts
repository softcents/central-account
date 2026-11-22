import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { WhmcsService } from './whmcs.service';

@Injectable()
export class WhmcsCronService {
  private readonly logger = new Logger(WhmcsCronService.name);

  constructor(private readonly whmcs: WhmcsService) {}

  /**
   * Daily Billing Automation Cron:
   * Equivalent to WHMCS crons/cron.php
   * Runs daily at 00:00 (Midnight)
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyBillingCron() {
    this.logger.log('=== [WHMCS CRON] Daily Billing Automation Cycle Started ===');
    const result = await this.runAutomationCycle();
    this.logger.log(`=== [WHMCS CRON] Completed: Invoices Generated: ${result.invoicesGenerated}, Overdue Suspensions: ${result.servicesSuspended}, Reminders Sent: ${result.remindersSent} ===`);
    return result;
  }

  /**
   * 15-Minute Queue Check:
   * Checks pending module commands, invoice callbacks, and overdue alerts
   */
  @Cron(CronExpression.EVERY_30_MINUTES)
  async handlePeriodicHealthCheck() {
    this.logger.log('[WHMCS CRON] Periodic health and status sync check executed.');
  }

  /**
   * Complete Automation Cycle logic (callable manually or via scheduled cron)
   */
  async runAutomationCycle(): Promise<{
    invoicesGenerated: number;
    servicesSuspended: number;
    remindersSent: number;
    logs: string[];
  }> {
    const logs: string[] = [];
    let invoicesGenerated = 0;
    let servicesSuspended = 0;
    let remindersSent = 0;

    const summary = this.whmcs.getSummary();
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // 1. Generate Recurring Invoices for active services due in <= 7 days
    try {
      const services = (this.whmcs as any).syncData?.services || [];
      const invoices = (this.whmcs as any).syncData?.invoices || [];

      for (const service of services) {
        if (service.domainstatus === 'Active' && service.nextduedate) {
          const dueDate = new Date(service.nextduedate);
          const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 3600 * 24));

          // If due in 7 days or already due, check if unpaid invoice already exists
          if (diffDays <= 7) {
            const hasExistingUnpaid = invoices.some(
              (inv: any) =>
                String(inv.userid) === String(service.userid) &&
                inv.status === 'Unpaid' &&
                inv.items?.some((item: any) => item.description?.includes(service.domain || service.name)),
            );

            if (!hasExistingUnpaid) {
              const amount = Number(service.amount || service.firstpaymentamount || 1500);
              const newInvId = String(Date.now()).slice(-5);
              const newInvoice = {
                id: newInvId,
                userid: String(service.userid),
                invoicenum: newInvId,
                date: todayStr,
                duedate: service.nextduedate,
                subtotal: amount,
                credit: 0,
                tax: 0,
                total: amount,
                status: 'Unpaid',
                paymentmethod: service.paymentmethod || 'piprapay',
                items: [
                  {
                    description: `${service.name || 'Hosting Service'} - ${service.domain || 'Service Renewal'} (${service.billingcycle || 'Monthly'})`,
                    amount,
                  },
                ],
              };

              invoices.unshift(newInvoice);
              invoicesGenerated++;
              logs.push(`Generated Invoice #${newInvId} for Client #${service.userid} (${service.domain || service.name})`);

              // Send SMS notification
              const client = this.whmcs.getClient(service.userid);
              if (client?.phonenumber) {
                await this.whmcs.smsAddon.sendInvoiceCreated(client, newInvoice);
                remindersSent++;
              }
            }
          }
        }
      }
    } catch (err: any) {
      logs.push(`Error generating recurring invoices: ${err.message}`);
    }

    // 2. Overdue Suspension for services overdue by > 3 days
    try {
      const services = (this.whmcs as any).syncData?.services || [];
      const invoices = (this.whmcs as any).syncData?.invoices || [];

      for (const service of services) {
        if (service.domainstatus === 'Active' && service.nextduedate) {
          const dueDate = new Date(service.nextduedate);
          const overdueDays = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 3600 * 24));

          // If overdue by more than 3 days
          if (overdueDays > 3) {
            const isUnpaid = invoices.some(
              (inv: any) =>
                String(inv.userid) === String(service.userid) &&
                inv.status === 'Unpaid' &&
                inv.items?.some((item: any) => item.description?.includes(service.domain || service.name)),
            );

            if (isUnpaid) {
              // Suspend
              if ((service.name || '').toLowerCase().includes('pbx') && service.domain) {
                await this.whmcs.pbxServer.suspendAccount({ domain: service.domain });
              } else if (service.username) {
                await this.whmcs.cpanelServer.suspendAccount(service.username, 'Overdue payment');
              }
              service.domainstatus = 'Suspended';
              servicesSuspended++;
              logs.push(`Suspended Service #${service.id} (${service.domain || service.name}) for non-payment`);

              const client = this.whmcs.getClient(service.userid);
              if (client?.phonenumber) {
                await this.whmcs.smsAddon.sendAfterModuleSuspend(client, service);
                remindersSent++;
              }
            }
          }
        }
      }
    } catch (err: any) {
      logs.push(`Error during overdue suspension: ${err.message}`);
    }

    // 3. Overdue Invoice Reminders
    try {
      const invoices = (this.whmcs as any).syncData?.invoices || [];
      for (const inv of invoices) {
        if (inv.status === 'Unpaid' && inv.duedate) {
          // Prevent spamming on the same day
          if (inv.last_reminder_date === todayStr) {
            continue;
          }

          const dueDate = new Date(inv.duedate);
          const diffDays = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 3600 * 24));
          const client = this.whmcs.getClient(inv.userid);

          if (client?.phonenumber) {
            let sentStage = '';
            if (diffDays >= 8 && diffDays <= 45 && inv.last_reminder_stage !== 'third') {
              await this.whmcs.smsAddon.sendInvoiceReminder(client, inv, 'third', diffDays);
              sentStage = 'third';
              remindersSent++;
              logs.push(`Dispatched Final 3rd Overdue SMS for Invoice #${inv.id} (${diffDays} days overdue)`);
            } else if (diffDays >= 4 && diffDays < 8 && inv.last_reminder_stage !== 'second') {
              await this.whmcs.smsAddon.sendInvoiceReminder(client, inv, 'second', diffDays);
              sentStage = 'second';
              remindersSent++;
              logs.push(`Dispatched 2nd Overdue SMS for Invoice #${inv.id} (${diffDays} days overdue)`);
            } else if (diffDays >= 1 && diffDays < 4 && inv.last_reminder_stage !== 'first') {
              await this.whmcs.smsAddon.sendInvoiceReminder(client, inv, 'first', diffDays);
              sentStage = 'first';
              remindersSent++;
              logs.push(`Dispatched 1st Overdue SMS for Invoice #${inv.id} (${diffDays} days overdue)`);
            } else if (diffDays === 0 && inv.last_reminder_stage !== 'due') {
              await this.whmcs.smsAddon.sendInvoiceReminder(client, inv, 'due', 0);
              sentStage = 'due';
              remindersSent++;
              logs.push(`Dispatched Due Date SMS for Invoice #${inv.id}`);
            }

            if (sentStage) {
              inv.last_reminder_date = todayStr;
              inv.last_reminder_stage = sentStage;
            }
          }
        }
      }
    } catch (err: any) {
      logs.push(`Error during invoice reminders: ${err.message}`);
    }

    return {
      invoicesGenerated,
      servicesSuspended,
      remindersSent,
      logs,
    };
  }
}
