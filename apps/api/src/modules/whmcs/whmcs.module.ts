import { Module } from '@nestjs/common';
import { PipraPayGateway } from './gateways/piprapay.gateway';
import { UddoktaPayGateway } from './gateways/uddoktapay.gateway';
import { ResellerGateway } from './gateways/reseller.gateway';
import { SoftcentsPbxServer } from './servers/softcentspbx.server';
import { CpanelServer } from './servers/cpanel.server';
import { BHPanelServer } from './servers/bhpanel.server';
import { VirtualizorServer } from './servers/virtualizor.server';
import { SoftcentsSmsAddon } from './addons/softcents-sms.addon';
import { SoftcentsVsmsAddon } from './addons/softcents-vsms.addon';
import { BdhostWaAddon } from './addons/bdhost-wa.addon';
import { ItalkRechargeAddon } from './addons/italk-recharge.addon';
import { SupportPinAddon } from './addons/supportpin.addon';
import { ClientVerificationAddon } from './addons/client-verification.addon';
import { DomainsResellerAddon } from './addons/domains-reseller.addon';
import { WhmcsService } from './whmcs.service';
import { WhmcsCronService } from './whmcs-cron.service';
import { WhmcsController } from './whmcs.controller';

@Module({
  controllers: [WhmcsController],
  providers: [
    PipraPayGateway,
    UddoktaPayGateway,
    ResellerGateway,
    SoftcentsPbxServer,
    CpanelServer,
    BHPanelServer,
    VirtualizorServer,
    SoftcentsSmsAddon,
    SoftcentsVsmsAddon,
    BdhostWaAddon,
    ItalkRechargeAddon,
    SupportPinAddon,
    ClientVerificationAddon,
    DomainsResellerAddon,
    WhmcsService,
    WhmcsCronService,
  ],
  exports: [
    WhmcsService,
    WhmcsCronService,
    PipraPayGateway,
    UddoktaPayGateway,
    ResellerGateway,
    SoftcentsPbxServer,
    CpanelServer,
    BHPanelServer,
    VirtualizorServer,
    SoftcentsSmsAddon,
    SoftcentsVsmsAddon,
    BdhostWaAddon,
    ItalkRechargeAddon,
    SupportPinAddon,
    ClientVerificationAddon,
    DomainsResellerAddon,
  ],
})
export class WhmcsModule {}
