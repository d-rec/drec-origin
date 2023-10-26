'use strict';

customElements.define('compodoc-menu', class extends HTMLElement {
    constructor() {
        super();
        this.isNormalMode = this.getAttribute('mode') === 'normal';
    }

    connectedCallback() {
        this.render(this.isNormalMode);
    }

    render(isNormalMode) {
        let tp = lithtml.html(`
        <nav>
            <ul class="list">
                <li class="title">
                    <a href="index.html" data-type="index-link">Drec api documentation</a>
                </li>

                <li class="divider"></li>
                ${ isNormalMode ? `<div id="book-search-input" role="search"><input type="text" placeholder="Type to search"></div>` : '' }
                <li class="chapter">
                    <a data-type="chapter-link" href="index.html"><span class="icon ion-ios-home"></span>Getting started</a>
                    <ul class="links">
                        <li class="link">
                            <a href="overview.html" data-type="chapter-link">
                                <span class="icon ion-ios-keypad"></span>Overview
                            </a>
                        </li>
                        <li class="link">
                            <a href="index.html" data-type="chapter-link">
                                <span class="icon ion-ios-paper"></span>README
                            </a>
                        </li>
                                <li class="link">
                                    <a href="dependencies.html" data-type="chapter-link">
                                        <span class="icon ion-ios-list"></span>Dependencies
                                    </a>
                                </li>
                                <li class="link">
                                    <a href="properties.html" data-type="chapter-link">
                                        <span class="icon ion-ios-apps"></span>Properties
                                    </a>
                                </li>
                    </ul>
                </li>
                    <li class="chapter modules">
                        <a data-type="chapter-link" href="modules.html">
                            <div class="menu-toggler linked" data-bs-toggle="collapse" ${ isNormalMode ?
                                'data-bs-target="#modules-links"' : 'data-bs-target="#xs-modules-links"' }>
                                <span class="icon ion-ios-archive"></span>
                                <span class="link-name">Modules</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                        </a>
                        <ul class="links collapse " ${ isNormalMode ? 'id="modules-links"' : 'id="xs-modules-links"' }>
                            <li class="link">
                                <a href="modules/AccessControlLayerModuleServiceModule.html" data-type="entity-link" >AccessControlLayerModuleServiceModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-AccessControlLayerModuleServiceModule-905dac7c55ecdec458f62687d78399602aa14727d09cd11f36b412c99864cc143670528df605c2c6158ae67f82583546c6dbf95d955541e6f5c3532468d04a4e"' : 'data-bs-target="#xs-controllers-links-module-AccessControlLayerModuleServiceModule-905dac7c55ecdec458f62687d78399602aa14727d09cd11f36b412c99864cc143670528df605c2c6158ae67f82583546c6dbf95d955541e6f5c3532468d04a4e"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-AccessControlLayerModuleServiceModule-905dac7c55ecdec458f62687d78399602aa14727d09cd11f36b412c99864cc143670528df605c2c6158ae67f82583546c6dbf95d955541e6f5c3532468d04a4e"' :
                                            'id="xs-controllers-links-module-AccessControlLayerModuleServiceModule-905dac7c55ecdec458f62687d78399602aa14727d09cd11f36b412c99864cc143670528df605c2c6158ae67f82583546c6dbf95d955541e6f5c3532468d04a4e"' }>
                                            <li class="link">
                                                <a href="controllers/AccessControlLayerModuleServiceController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AccessControlLayerModuleServiceController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-AccessControlLayerModuleServiceModule-905dac7c55ecdec458f62687d78399602aa14727d09cd11f36b412c99864cc143670528df605c2c6158ae67f82583546c6dbf95d955541e6f5c3532468d04a4e"' : 'data-bs-target="#xs-injectables-links-module-AccessControlLayerModuleServiceModule-905dac7c55ecdec458f62687d78399602aa14727d09cd11f36b412c99864cc143670528df605c2c6158ae67f82583546c6dbf95d955541e6f5c3532468d04a4e"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-AccessControlLayerModuleServiceModule-905dac7c55ecdec458f62687d78399602aa14727d09cd11f36b412c99864cc143670528df605c2c6158ae67f82583546c6dbf95d955541e6f5c3532468d04a4e"' :
                                        'id="xs-injectables-links-module-AccessControlLayerModuleServiceModule-905dac7c55ecdec458f62687d78399602aa14727d09cd11f36b412c99864cc143670528df605c2c6158ae67f82583546c6dbf95d955541e6f5c3532468d04a4e"' }>
                                        <li class="link">
                                            <a href="injectables/AccessControlLayerModuleServiceService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AccessControlLayerModuleServiceService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/AdminModule.html" data-type="entity-link" >AdminModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-AdminModule-50949fda0d7e0ff748eb2dc2d9253e10153cf0d8e51706cab9f7d8d3a75b15eea2a415e21f46d2e33a137323094e73b00cfc3c19033d275f97d60e8d3588c857"' : 'data-bs-target="#xs-controllers-links-module-AdminModule-50949fda0d7e0ff748eb2dc2d9253e10153cf0d8e51706cab9f7d8d3a75b15eea2a415e21f46d2e33a137323094e73b00cfc3c19033d275f97d60e8d3588c857"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-AdminModule-50949fda0d7e0ff748eb2dc2d9253e10153cf0d8e51706cab9f7d8d3a75b15eea2a415e21f46d2e33a137323094e73b00cfc3c19033d275f97d60e8d3588c857"' :
                                            'id="xs-controllers-links-module-AdminModule-50949fda0d7e0ff748eb2dc2d9253e10153cf0d8e51706cab9f7d8d3a75b15eea2a415e21f46d2e33a137323094e73b00cfc3c19033d275f97d60e8d3588c857"' }>
                                            <li class="link">
                                                <a href="controllers/AdminController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AdminController</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/AuthModule.html" data-type="entity-link" >AuthModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-AuthModule-df36c0fe6b3678cd4474dc45b82d03ffc5059e5a55f19e63e26429104172793932b9a75a67941642758d307ee1e27cd9eff3439faec0347988c40993ab802e16"' : 'data-bs-target="#xs-controllers-links-module-AuthModule-df36c0fe6b3678cd4474dc45b82d03ffc5059e5a55f19e63e26429104172793932b9a75a67941642758d307ee1e27cd9eff3439faec0347988c40993ab802e16"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-AuthModule-df36c0fe6b3678cd4474dc45b82d03ffc5059e5a55f19e63e26429104172793932b9a75a67941642758d307ee1e27cd9eff3439faec0347988c40993ab802e16"' :
                                            'id="xs-controllers-links-module-AuthModule-df36c0fe6b3678cd4474dc45b82d03ffc5059e5a55f19e63e26429104172793932b9a75a67941642758d307ee1e27cd9eff3439faec0347988c40993ab802e16"' }>
                                            <li class="link">
                                                <a href="controllers/AuthController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AuthController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-AuthModule-df36c0fe6b3678cd4474dc45b82d03ffc5059e5a55f19e63e26429104172793932b9a75a67941642758d307ee1e27cd9eff3439faec0347988c40993ab802e16"' : 'data-bs-target="#xs-injectables-links-module-AuthModule-df36c0fe6b3678cd4474dc45b82d03ffc5059e5a55f19e63e26429104172793932b9a75a67941642758d307ee1e27cd9eff3439faec0347988c40993ab802e16"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-AuthModule-df36c0fe6b3678cd4474dc45b82d03ffc5059e5a55f19e63e26429104172793932b9a75a67941642758d307ee1e27cd9eff3439faec0347988c40993ab802e16"' :
                                        'id="xs-injectables-links-module-AuthModule-df36c0fe6b3678cd4474dc45b82d03ffc5059e5a55f19e63e26429104172793932b9a75a67941642758d307ee1e27cd9eff3439faec0347988c40993ab802e16"' }>
                                        <li class="link">
                                            <a href="injectables/AuthService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AuthService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/ClientCredentialsStrategy.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ClientCredentialsStrategy</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/JwtStrategy.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >JwtStrategy</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/LocalStrategy.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LocalStrategy</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/CertificateLogModule.html" data-type="entity-link" >CertificateLogModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-CertificateLogModule-08a0864c59c0fce880ac7182d50c38a2dc2069a499f8aa31d2318627e44bb077028e3857b1006b54578d5ff3de473477449eaf2396735af1dbf6140f442fe5e8"' : 'data-bs-target="#xs-controllers-links-module-CertificateLogModule-08a0864c59c0fce880ac7182d50c38a2dc2069a499f8aa31d2318627e44bb077028e3857b1006b54578d5ff3de473477449eaf2396735af1dbf6140f442fe5e8"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-CertificateLogModule-08a0864c59c0fce880ac7182d50c38a2dc2069a499f8aa31d2318627e44bb077028e3857b1006b54578d5ff3de473477449eaf2396735af1dbf6140f442fe5e8"' :
                                            'id="xs-controllers-links-module-CertificateLogModule-08a0864c59c0fce880ac7182d50c38a2dc2069a499f8aa31d2318627e44bb077028e3857b1006b54578d5ff3de473477449eaf2396735af1dbf6140f442fe5e8"' }>
                                            <li class="link">
                                                <a href="controllers/CertificateLogController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CertificateLogController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-CertificateLogModule-08a0864c59c0fce880ac7182d50c38a2dc2069a499f8aa31d2318627e44bb077028e3857b1006b54578d5ff3de473477449eaf2396735af1dbf6140f442fe5e8"' : 'data-bs-target="#xs-injectables-links-module-CertificateLogModule-08a0864c59c0fce880ac7182d50c38a2dc2069a499f8aa31d2318627e44bb077028e3857b1006b54578d5ff3de473477449eaf2396735af1dbf6140f442fe5e8"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-CertificateLogModule-08a0864c59c0fce880ac7182d50c38a2dc2069a499f8aa31d2318627e44bb077028e3857b1006b54578d5ff3de473477449eaf2396735af1dbf6140f442fe5e8"' :
                                        'id="xs-injectables-links-module-CertificateLogModule-08a0864c59c0fce880ac7182d50c38a2dc2069a499f8aa31d2318627e44bb077028e3857b1006b54578d5ff3de473477449eaf2396735af1dbf6140f442fe5e8"' }>
                                        <li class="link">
                                            <a href="injectables/CertificateLogService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CertificateLogService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/CountrycodeModule.html" data-type="entity-link" >CountrycodeModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-CountrycodeModule-9a4ccfb46c43c642d8c6a8662c1de393191ccd0962334faffc894bf16214d0d7a0461002dafdd4a3c1c068826a7ce24aa2a7a52dd40536e1916e8b5c90491e85"' : 'data-bs-target="#xs-controllers-links-module-CountrycodeModule-9a4ccfb46c43c642d8c6a8662c1de393191ccd0962334faffc894bf16214d0d7a0461002dafdd4a3c1c068826a7ce24aa2a7a52dd40536e1916e8b5c90491e85"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-CountrycodeModule-9a4ccfb46c43c642d8c6a8662c1de393191ccd0962334faffc894bf16214d0d7a0461002dafdd4a3c1c068826a7ce24aa2a7a52dd40536e1916e8b5c90491e85"' :
                                            'id="xs-controllers-links-module-CountrycodeModule-9a4ccfb46c43c642d8c6a8662c1de393191ccd0962334faffc894bf16214d0d7a0461002dafdd4a3c1c068826a7ce24aa2a7a52dd40536e1916e8b5c90491e85"' }>
                                            <li class="link">
                                                <a href="controllers/CountrycodeController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CountrycodeController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-CountrycodeModule-9a4ccfb46c43c642d8c6a8662c1de393191ccd0962334faffc894bf16214d0d7a0461002dafdd4a3c1c068826a7ce24aa2a7a52dd40536e1916e8b5c90491e85"' : 'data-bs-target="#xs-injectables-links-module-CountrycodeModule-9a4ccfb46c43c642d8c6a8662c1de393191ccd0962334faffc894bf16214d0d7a0461002dafdd4a3c1c068826a7ce24aa2a7a52dd40536e1916e8b5c90491e85"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-CountrycodeModule-9a4ccfb46c43c642d8c6a8662c1de393191ccd0962334faffc894bf16214d0d7a0461002dafdd4a3c1c068826a7ce24aa2a7a52dd40536e1916e8b5c90491e85"' :
                                        'id="xs-injectables-links-module-CountrycodeModule-9a4ccfb46c43c642d8c6a8662c1de393191ccd0962334faffc894bf16214d0d7a0461002dafdd4a3c1c068826a7ce24aa2a7a52dd40536e1916e8b5c90491e85"' }>
                                        <li class="link">
                                            <a href="injectables/CountrycodeService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CountrycodeService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/DeviceGroupModule.html" data-type="entity-link" >DeviceGroupModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-DeviceGroupModule-cc2e1a1d416d04b8959e78f4b84a481b5b301f2dec1fde07c0786eba8f74d0cda9a0d0ff588f31b5bbc35fe81c5a5998faf2e1c16879cefd16efd9166031ba85"' : 'data-bs-target="#xs-controllers-links-module-DeviceGroupModule-cc2e1a1d416d04b8959e78f4b84a481b5b301f2dec1fde07c0786eba8f74d0cda9a0d0ff588f31b5bbc35fe81c5a5998faf2e1c16879cefd16efd9166031ba85"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-DeviceGroupModule-cc2e1a1d416d04b8959e78f4b84a481b5b301f2dec1fde07c0786eba8f74d0cda9a0d0ff588f31b5bbc35fe81c5a5998faf2e1c16879cefd16efd9166031ba85"' :
                                            'id="xs-controllers-links-module-DeviceGroupModule-cc2e1a1d416d04b8959e78f4b84a481b5b301f2dec1fde07c0786eba8f74d0cda9a0d0ff588f31b5bbc35fe81c5a5998faf2e1c16879cefd16efd9166031ba85"' }>
                                            <li class="link">
                                                <a href="controllers/BuyerReservationController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >BuyerReservationController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-DeviceGroupModule-cc2e1a1d416d04b8959e78f4b84a481b5b301f2dec1fde07c0786eba8f74d0cda9a0d0ff588f31b5bbc35fe81c5a5998faf2e1c16879cefd16efd9166031ba85"' : 'data-bs-target="#xs-injectables-links-module-DeviceGroupModule-cc2e1a1d416d04b8959e78f4b84a481b5b301f2dec1fde07c0786eba8f74d0cda9a0d0ff588f31b5bbc35fe81c5a5998faf2e1c16879cefd16efd9166031ba85"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-DeviceGroupModule-cc2e1a1d416d04b8959e78f4b84a481b5b301f2dec1fde07c0786eba8f74d0cda9a0d0ff588f31b5bbc35fe81c5a5998faf2e1c16879cefd16efd9166031ba85"' :
                                        'id="xs-injectables-links-module-DeviceGroupModule-cc2e1a1d416d04b8959e78f4b84a481b5b301f2dec1fde07c0786eba8f74d0cda9a0d0ff588f31b5bbc35fe81c5a5998faf2e1c16879cefd16efd9166031ba85"' }>
                                        <li class="link">
                                            <a href="injectables/DeviceGroupService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >DeviceGroupService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/DeviceModule.html" data-type="entity-link" >DeviceModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-DeviceModule-0bd1fe0151391dbb44e1d100cb97771b8126c02cbeaa3a6abcb52e2b22ae988d4a68cc9676ef0771b855e9b2e331ae12e6cf4e4136edfbed2abe3dae24d405aa"' : 'data-bs-target="#xs-controllers-links-module-DeviceModule-0bd1fe0151391dbb44e1d100cb97771b8126c02cbeaa3a6abcb52e2b22ae988d4a68cc9676ef0771b855e9b2e331ae12e6cf4e4136edfbed2abe3dae24d405aa"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-DeviceModule-0bd1fe0151391dbb44e1d100cb97771b8126c02cbeaa3a6abcb52e2b22ae988d4a68cc9676ef0771b855e9b2e331ae12e6cf4e4136edfbed2abe3dae24d405aa"' :
                                            'id="xs-controllers-links-module-DeviceModule-0bd1fe0151391dbb44e1d100cb97771b8126c02cbeaa3a6abcb52e2b22ae988d4a68cc9676ef0771b855e9b2e331ae12e6cf4e4136edfbed2abe3dae24d405aa"' }>
                                            <li class="link">
                                                <a href="controllers/DeviceController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >DeviceController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-DeviceModule-0bd1fe0151391dbb44e1d100cb97771b8126c02cbeaa3a6abcb52e2b22ae988d4a68cc9676ef0771b855e9b2e331ae12e6cf4e4136edfbed2abe3dae24d405aa"' : 'data-bs-target="#xs-injectables-links-module-DeviceModule-0bd1fe0151391dbb44e1d100cb97771b8126c02cbeaa3a6abcb52e2b22ae988d4a68cc9676ef0771b855e9b2e331ae12e6cf4e4136edfbed2abe3dae24d405aa"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-DeviceModule-0bd1fe0151391dbb44e1d100cb97771b8126c02cbeaa3a6abcb52e2b22ae988d4a68cc9676ef0771b855e9b2e331ae12e6cf4e4136edfbed2abe3dae24d405aa"' :
                                        'id="xs-injectables-links-module-DeviceModule-0bd1fe0151391dbb44e1d100cb97771b8126c02cbeaa3a6abcb52e2b22ae988d4a68cc9676ef0771b855e9b2e331ae12e6cf4e4136edfbed2abe3dae24d405aa"' }>
                                        <li class="link">
                                            <a href="injectables/DeviceService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >DeviceService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/DrecModule.html" data-type="entity-link" >DrecModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-DrecModule-8b9c7fc7803a5849a0ad8f20cbd528a71209220d952daffaf73be520c6dd83ab0ac32875138bbd39b197cfbc1c0604a14a02258e26a797774285d68026a4cea2"' : 'data-bs-target="#xs-injectables-links-module-DrecModule-8b9c7fc7803a5849a0ad8f20cbd528a71209220d952daffaf73be520c6dd83ab0ac32875138bbd39b197cfbc1c0604a14a02258e26a797774285d68026a4cea2"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-DrecModule-8b9c7fc7803a5849a0ad8f20cbd528a71209220d952daffaf73be520c6dd83ab0ac32875138bbd39b197cfbc1c0604a14a02258e26a797774285d68026a4cea2"' :
                                        'id="xs-injectables-links-module-DrecModule-8b9c7fc7803a5849a0ad8f20cbd528a71209220d952daffaf73be520c6dd83ab0ac32875138bbd39b197cfbc1c0604a14a02258e26a797774285d68026a4cea2"' }>
                                        <li class="link">
                                            <a href="injectables/OnApplicationBootstrapHookService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >OnApplicationBootstrapHookService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/EmailConfirmationModule.html" data-type="entity-link" >EmailConfirmationModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-EmailConfirmationModule-667ed4d926b641728e1a15de80e0cbef600c2c797a77505ecc254d876d76394647dc32dbd9ae0b60b03ece63c26bd96f482a832f80d3b77db4e3bf8709420e4e"' : 'data-bs-target="#xs-injectables-links-module-EmailConfirmationModule-667ed4d926b641728e1a15de80e0cbef600c2c797a77505ecc254d876d76394647dc32dbd9ae0b60b03ece63c26bd96f482a832f80d3b77db4e3bf8709420e4e"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-EmailConfirmationModule-667ed4d926b641728e1a15de80e0cbef600c2c797a77505ecc254d876d76394647dc32dbd9ae0b60b03ece63c26bd96f482a832f80d3b77db4e3bf8709420e4e"' :
                                        'id="xs-injectables-links-module-EmailConfirmationModule-667ed4d926b641728e1a15de80e0cbef600c2c797a77505ecc254d876d76394647dc32dbd9ae0b60b03ece63c26bd96f482a832f80d3b77db4e3bf8709420e4e"' }>
                                        <li class="link">
                                            <a href="injectables/EmailConfirmationService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >EmailConfirmationService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/FileModule.html" data-type="entity-link" >FileModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-FileModule-8c3c86f6fdd344a3b88ac0db5f8101a7ed8622842f230e22970f37c2a2c504000f3c9a93c5ecbbb1f4ed237e1f09820c65c5f72b0b9447841701f664703c8f3c"' : 'data-bs-target="#xs-controllers-links-module-FileModule-8c3c86f6fdd344a3b88ac0db5f8101a7ed8622842f230e22970f37c2a2c504000f3c9a93c5ecbbb1f4ed237e1f09820c65c5f72b0b9447841701f664703c8f3c"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-FileModule-8c3c86f6fdd344a3b88ac0db5f8101a7ed8622842f230e22970f37c2a2c504000f3c9a93c5ecbbb1f4ed237e1f09820c65c5f72b0b9447841701f664703c8f3c"' :
                                            'id="xs-controllers-links-module-FileModule-8c3c86f6fdd344a3b88ac0db5f8101a7ed8622842f230e22970f37c2a2c504000f3c9a93c5ecbbb1f4ed237e1f09820c65c5f72b0b9447841701f664703c8f3c"' }>
                                            <li class="link">
                                                <a href="controllers/FileController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >FileController</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/IntegratorsModule.html" data-type="entity-link" >IntegratorsModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-IntegratorsModule-a5ac8a15f16573a547ede40ce02b25d74b37afcbdabfd89ae1d46350e9ea462a26c64004355911f55aa360b2d94e5cb847e1fec1ab483c1d754be95270e748dd"' : 'data-bs-target="#xs-injectables-links-module-IntegratorsModule-a5ac8a15f16573a547ede40ce02b25d74b37afcbdabfd89ae1d46350e9ea462a26c64004355911f55aa360b2d94e5cb847e1fec1ab483c1d754be95270e748dd"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-IntegratorsModule-a5ac8a15f16573a547ede40ce02b25d74b37afcbdabfd89ae1d46350e9ea462a26c64004355911f55aa360b2d94e5cb847e1fec1ab483c1d754be95270e748dd"' :
                                        'id="xs-injectables-links-module-IntegratorsModule-a5ac8a15f16573a547ede40ce02b25d74b37afcbdabfd89ae1d46350e9ea462a26c64004355911f55aa360b2d94e5cb847e1fec1ab483c1d754be95270e748dd"' }>
                                        <li class="link">
                                            <a href="injectables/IntegratorsService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >IntegratorsService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/InvitationModule.html" data-type="entity-link" >InvitationModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-InvitationModule-fdaac3515ca75c11fa2c57a3f2c55f4091913aca3afb60042247e6ae1891b7d5874f1cb2455ed666e0eac395fbf893e68a19da6bcdfebdfb3e1ac1faf82364e1"' : 'data-bs-target="#xs-controllers-links-module-InvitationModule-fdaac3515ca75c11fa2c57a3f2c55f4091913aca3afb60042247e6ae1891b7d5874f1cb2455ed666e0eac395fbf893e68a19da6bcdfebdfb3e1ac1faf82364e1"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-InvitationModule-fdaac3515ca75c11fa2c57a3f2c55f4091913aca3afb60042247e6ae1891b7d5874f1cb2455ed666e0eac395fbf893e68a19da6bcdfebdfb3e1ac1faf82364e1"' :
                                            'id="xs-controllers-links-module-InvitationModule-fdaac3515ca75c11fa2c57a3f2c55f4091913aca3afb60042247e6ae1891b7d5874f1cb2455ed666e0eac395fbf893e68a19da6bcdfebdfb3e1ac1faf82364e1"' }>
                                            <li class="link">
                                                <a href="controllers/InvitationController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >InvitationController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-InvitationModule-fdaac3515ca75c11fa2c57a3f2c55f4091913aca3afb60042247e6ae1891b7d5874f1cb2455ed666e0eac395fbf893e68a19da6bcdfebdfb3e1ac1faf82364e1"' : 'data-bs-target="#xs-injectables-links-module-InvitationModule-fdaac3515ca75c11fa2c57a3f2c55f4091913aca3afb60042247e6ae1891b7d5874f1cb2455ed666e0eac395fbf893e68a19da6bcdfebdfb3e1ac1faf82364e1"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-InvitationModule-fdaac3515ca75c11fa2c57a3f2c55f4091913aca3afb60042247e6ae1891b7d5874f1cb2455ed666e0eac395fbf893e68a19da6bcdfebdfb3e1ac1faf82364e1"' :
                                        'id="xs-injectables-links-module-InvitationModule-fdaac3515ca75c11fa2c57a3f2c55f4091913aca3afb60042247e6ae1891b7d5874f1cb2455ed666e0eac395fbf893e68a19da6bcdfebdfb3e1ac1faf82364e1"' }>
                                        <li class="link">
                                            <a href="injectables/InvitationService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >InvitationService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/IssuerModule.html" data-type="entity-link" >IssuerModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-IssuerModule-ad4dbb2690923f3da6d7bd176b1740828f81c6ffce15e72589dd2307f3c5243cd1053a3222a9197c3e2443260f35a1f6d1ff1a29fa927f35641c2c539b813c5a"' : 'data-bs-target="#xs-controllers-links-module-IssuerModule-ad4dbb2690923f3da6d7bd176b1740828f81c6ffce15e72589dd2307f3c5243cd1053a3222a9197c3e2443260f35a1f6d1ff1a29fa927f35641c2c539b813c5a"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-IssuerModule-ad4dbb2690923f3da6d7bd176b1740828f81c6ffce15e72589dd2307f3c5243cd1053a3222a9197c3e2443260f35a1f6d1ff1a29fa927f35641c2c539b813c5a"' :
                                            'id="xs-controllers-links-module-IssuerModule-ad4dbb2690923f3da6d7bd176b1740828f81c6ffce15e72589dd2307f3c5243cd1053a3222a9197c3e2443260f35a1f6d1ff1a29fa927f35641c2c539b813c5a"' }>
                                            <li class="link">
                                                <a href="controllers/DrecIssuerController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >DrecIssuerController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-IssuerModule-ad4dbb2690923f3da6d7bd176b1740828f81c6ffce15e72589dd2307f3c5243cd1053a3222a9197c3e2443260f35a1f6d1ff1a29fa927f35641c2c539b813c5a"' : 'data-bs-target="#xs-injectables-links-module-IssuerModule-ad4dbb2690923f3da6d7bd176b1740828f81c6ffce15e72589dd2307f3c5243cd1053a3222a9197c3e2443260f35a1f6d1ff1a29fa927f35641c2c539b813c5a"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-IssuerModule-ad4dbb2690923f3da6d7bd176b1740828f81c6ffce15e72589dd2307f3c5243cd1053a3222a9197c3e2443260f35a1f6d1ff1a29fa927f35641c2c539b813c5a"' :
                                        'id="xs-injectables-links-module-IssuerModule-ad4dbb2690923f3da6d7bd176b1740828f81c6ffce15e72589dd2307f3c5243cd1053a3222a9197c3e2443260f35a1f6d1ff1a29fa927f35641c2c539b813c5a"' }>
                                        <li class="link">
                                            <a href="injectables/IssuerService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >IssuerService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/SynchronizeBlockchainTaskService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SynchronizeBlockchainTaskService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/MailModule.html" data-type="entity-link" >MailModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-MailModule-20c8b79ddede66f29641746145cdda1e96ec641b93e8919a72f9e98536f161ea8beb31daf42de9339a9f6f8dd3ba746689357bd288bf36ab79e2b5efdc1a982b"' : 'data-bs-target="#xs-injectables-links-module-MailModule-20c8b79ddede66f29641746145cdda1e96ec641b93e8919a72f9e98536f161ea8beb31daf42de9339a9f6f8dd3ba746689357bd288bf36ab79e2b5efdc1a982b"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-MailModule-20c8b79ddede66f29641746145cdda1e96ec641b93e8919a72f9e98536f161ea8beb31daf42de9339a9f6f8dd3ba746689357bd288bf36ab79e2b5efdc1a982b"' :
                                        'id="xs-injectables-links-module-MailModule-20c8b79ddede66f29641746145cdda1e96ec641b93e8919a72f9e98536f161ea8beb31daf42de9339a9f6f8dd3ba746689357bd288bf36ab79e2b5efdc1a982b"' }>
                                        <li class="link">
                                            <a href="injectables/MailService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >MailService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/OrganizationModule.html" data-type="entity-link" >OrganizationModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-OrganizationModule-2c7a3f5315b67ad06008c6b5e004b25ce3a496f5aea56adfd40f87d8056e16d7856055d4c9f1acd09100f89f2a6516086f254c3a1758da88d873c8a7520d7d1a"' : 'data-bs-target="#xs-controllers-links-module-OrganizationModule-2c7a3f5315b67ad06008c6b5e004b25ce3a496f5aea56adfd40f87d8056e16d7856055d4c9f1acd09100f89f2a6516086f254c3a1758da88d873c8a7520d7d1a"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-OrganizationModule-2c7a3f5315b67ad06008c6b5e004b25ce3a496f5aea56adfd40f87d8056e16d7856055d4c9f1acd09100f89f2a6516086f254c3a1758da88d873c8a7520d7d1a"' :
                                            'id="xs-controllers-links-module-OrganizationModule-2c7a3f5315b67ad06008c6b5e004b25ce3a496f5aea56adfd40f87d8056e16d7856055d4c9f1acd09100f89f2a6516086f254c3a1758da88d873c8a7520d7d1a"' }>
                                            <li class="link">
                                                <a href="controllers/OrganizationController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >OrganizationController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-OrganizationModule-2c7a3f5315b67ad06008c6b5e004b25ce3a496f5aea56adfd40f87d8056e16d7856055d4c9f1acd09100f89f2a6516086f254c3a1758da88d873c8a7520d7d1a"' : 'data-bs-target="#xs-injectables-links-module-OrganizationModule-2c7a3f5315b67ad06008c6b5e004b25ce3a496f5aea56adfd40f87d8056e16d7856055d4c9f1acd09100f89f2a6516086f254c3a1758da88d873c8a7520d7d1a"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-OrganizationModule-2c7a3f5315b67ad06008c6b5e004b25ce3a496f5aea56adfd40f87d8056e16d7856055d4c9f1acd09100f89f2a6516086f254c3a1758da88d873c8a7520d7d1a"' :
                                        'id="xs-injectables-links-module-OrganizationModule-2c7a3f5315b67ad06008c6b5e004b25ce3a496f5aea56adfd40f87d8056e16d7856055d4c9f1acd09100f89f2a6516086f254c3a1758da88d873c8a7520d7d1a"' }>
                                        <li class="link">
                                            <a href="injectables/OrganizationService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >OrganizationService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/PermissionModule.html" data-type="entity-link" >PermissionModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-PermissionModule-0486904e8fe2c7e3794d6d0bed6f975a69bc1208bf5b3ee21624b334ddb82330a2fe2aa251a8d404d39a7acffc3ed44e4558072a85420fa14f1f39ec5eb0cbaa"' : 'data-bs-target="#xs-controllers-links-module-PermissionModule-0486904e8fe2c7e3794d6d0bed6f975a69bc1208bf5b3ee21624b334ddb82330a2fe2aa251a8d404d39a7acffc3ed44e4558072a85420fa14f1f39ec5eb0cbaa"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-PermissionModule-0486904e8fe2c7e3794d6d0bed6f975a69bc1208bf5b3ee21624b334ddb82330a2fe2aa251a8d404d39a7acffc3ed44e4558072a85420fa14f1f39ec5eb0cbaa"' :
                                            'id="xs-controllers-links-module-PermissionModule-0486904e8fe2c7e3794d6d0bed6f975a69bc1208bf5b3ee21624b334ddb82330a2fe2aa251a8d404d39a7acffc3ed44e4558072a85420fa14f1f39ec5eb0cbaa"' }>
                                            <li class="link">
                                                <a href="controllers/PermissionController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >PermissionController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-PermissionModule-0486904e8fe2c7e3794d6d0bed6f975a69bc1208bf5b3ee21624b334ddb82330a2fe2aa251a8d404d39a7acffc3ed44e4558072a85420fa14f1f39ec5eb0cbaa"' : 'data-bs-target="#xs-injectables-links-module-PermissionModule-0486904e8fe2c7e3794d6d0bed6f975a69bc1208bf5b3ee21624b334ddb82330a2fe2aa251a8d404d39a7acffc3ed44e4558072a85420fa14f1f39ec5eb0cbaa"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-PermissionModule-0486904e8fe2c7e3794d6d0bed6f975a69bc1208bf5b3ee21624b334ddb82330a2fe2aa251a8d404d39a7acffc3ed44e4558072a85420fa14f1f39ec5eb0cbaa"' :
                                        'id="xs-injectables-links-module-PermissionModule-0486904e8fe2c7e3794d6d0bed6f975a69bc1208bf5b3ee21624b334ddb82330a2fe2aa251a8d404d39a7acffc3ed44e4558072a85420fa14f1f39ec5eb0cbaa"' }>
                                        <li class="link">
                                            <a href="injectables/PermissionService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >PermissionService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/ReadsModule.html" data-type="entity-link" >ReadsModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-ReadsModule-880f04bc767b1a4fe660c2417f922f8430b757a86e7edc66e33856d8159000bc8b5b356b03046b715158920e4c6f86fd571933627d185fb4d4bda3076f348e04"' : 'data-bs-target="#xs-controllers-links-module-ReadsModule-880f04bc767b1a4fe660c2417f922f8430b757a86e7edc66e33856d8159000bc8b5b356b03046b715158920e4c6f86fd571933627d185fb4d4bda3076f348e04"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-ReadsModule-880f04bc767b1a4fe660c2417f922f8430b757a86e7edc66e33856d8159000bc8b5b356b03046b715158920e4c6f86fd571933627d185fb4d4bda3076f348e04"' :
                                            'id="xs-controllers-links-module-ReadsModule-880f04bc767b1a4fe660c2417f922f8430b757a86e7edc66e33856d8159000bc8b5b356b03046b715158920e4c6f86fd571933627d185fb4d4bda3076f348e04"' }>
                                            <li class="link">
                                                <a href="controllers/ReadsController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ReadsController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-ReadsModule-880f04bc767b1a4fe660c2417f922f8430b757a86e7edc66e33856d8159000bc8b5b356b03046b715158920e4c6f86fd571933627d185fb4d4bda3076f348e04"' : 'data-bs-target="#xs-injectables-links-module-ReadsModule-880f04bc767b1a4fe660c2417f922f8430b757a86e7edc66e33856d8159000bc8b5b356b03046b715158920e4c6f86fd571933627d185fb4d4bda3076f348e04"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-ReadsModule-880f04bc767b1a4fe660c2417f922f8430b757a86e7edc66e33856d8159000bc8b5b356b03046b715158920e4c6f86fd571933627d185fb4d4bda3076f348e04"' :
                                        'id="xs-injectables-links-module-ReadsModule-880f04bc767b1a4fe660c2417f922f8430b757a86e7edc66e33856d8159000bc8b5b356b03046b715158920e4c6f86fd571933627d185fb4d4bda3076f348e04"' }>
                                        <li class="link">
                                            <a href="injectables/ReadsService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ReadsService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/SdgbenefitModule.html" data-type="entity-link" >SdgbenefitModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-SdgbenefitModule-f3fad9a5ca260d25154eaed4eae359b262c4c547a4b2f3c9133d0886cfe4a99e8181c598530f6060b1a7cf9aa2b40790e48f55d7575929eda3bfedfff8ee2433"' : 'data-bs-target="#xs-controllers-links-module-SdgbenefitModule-f3fad9a5ca260d25154eaed4eae359b262c4c547a4b2f3c9133d0886cfe4a99e8181c598530f6060b1a7cf9aa2b40790e48f55d7575929eda3bfedfff8ee2433"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-SdgbenefitModule-f3fad9a5ca260d25154eaed4eae359b262c4c547a4b2f3c9133d0886cfe4a99e8181c598530f6060b1a7cf9aa2b40790e48f55d7575929eda3bfedfff8ee2433"' :
                                            'id="xs-controllers-links-module-SdgbenefitModule-f3fad9a5ca260d25154eaed4eae359b262c4c547a4b2f3c9133d0886cfe4a99e8181c598530f6060b1a7cf9aa2b40790e48f55d7575929eda3bfedfff8ee2433"' }>
                                            <li class="link">
                                                <a href="controllers/SdgbenefitController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SdgbenefitController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-SdgbenefitModule-f3fad9a5ca260d25154eaed4eae359b262c4c547a4b2f3c9133d0886cfe4a99e8181c598530f6060b1a7cf9aa2b40790e48f55d7575929eda3bfedfff8ee2433"' : 'data-bs-target="#xs-injectables-links-module-SdgbenefitModule-f3fad9a5ca260d25154eaed4eae359b262c4c547a4b2f3c9133d0886cfe4a99e8181c598530f6060b1a7cf9aa2b40790e48f55d7575929eda3bfedfff8ee2433"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-SdgbenefitModule-f3fad9a5ca260d25154eaed4eae359b262c4c547a4b2f3c9133d0886cfe4a99e8181c598530f6060b1a7cf9aa2b40790e48f55d7575929eda3bfedfff8ee2433"' :
                                        'id="xs-injectables-links-module-SdgbenefitModule-f3fad9a5ca260d25154eaed4eae359b262c4c547a4b2f3c9133d0886cfe4a99e8181c598530f6060b1a7cf9aa2b40790e48f55d7575929eda3bfedfff8ee2433"' }>
                                        <li class="link">
                                            <a href="injectables/SdgbenefitService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SdgbenefitService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/UserModule.html" data-type="entity-link" >UserModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-UserModule-667abb69cd735d2aa75c741bf917db1392a5bb7979feec303e28b89dce26f4ab6546b0ee511ee519b2479b5d314e714c86da91fb1a90b06a26a0b18e36526fc6"' : 'data-bs-target="#xs-controllers-links-module-UserModule-667abb69cd735d2aa75c741bf917db1392a5bb7979feec303e28b89dce26f4ab6546b0ee511ee519b2479b5d314e714c86da91fb1a90b06a26a0b18e36526fc6"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-UserModule-667abb69cd735d2aa75c741bf917db1392a5bb7979feec303e28b89dce26f4ab6546b0ee511ee519b2479b5d314e714c86da91fb1a90b06a26a0b18e36526fc6"' :
                                            'id="xs-controllers-links-module-UserModule-667abb69cd735d2aa75c741bf917db1392a5bb7979feec303e28b89dce26f4ab6546b0ee511ee519b2479b5d314e714c86da91fb1a90b06a26a0b18e36526fc6"' }>
                                            <li class="link">
                                                <a href="controllers/UserController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >UserController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-UserModule-667abb69cd735d2aa75c741bf917db1392a5bb7979feec303e28b89dce26f4ab6546b0ee511ee519b2479b5d314e714c86da91fb1a90b06a26a0b18e36526fc6"' : 'data-bs-target="#xs-injectables-links-module-UserModule-667abb69cd735d2aa75c741bf917db1392a5bb7979feec303e28b89dce26f4ab6546b0ee511ee519b2479b5d314e714c86da91fb1a90b06a26a0b18e36526fc6"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-UserModule-667abb69cd735d2aa75c741bf917db1392a5bb7979feec303e28b89dce26f4ab6546b0ee511ee519b2479b5d314e714c86da91fb1a90b06a26a0b18e36526fc6"' :
                                        'id="xs-injectables-links-module-UserModule-667abb69cd735d2aa75c741bf917db1392a5bb7979feec303e28b89dce26f4ab6546b0ee511ee519b2479b5d314e714c86da91fb1a90b06a26a0b18e36526fc6"' }>
                                        <li class="link">
                                            <a href="injectables/OauthClientCredentialsService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >OauthClientCredentialsService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/UserService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >UserService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/YieldConfigModule.html" data-type="entity-link" >YieldConfigModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#controllers-links-module-YieldConfigModule-c248027b66a194ab44745e24c7be76064b98316e71518b8bc084795fc317eaea83db41cc87b6839ed1e09c95b6988390a2bb53980755b9a458fafdcabca51595"' : 'data-bs-target="#xs-controllers-links-module-YieldConfigModule-c248027b66a194ab44745e24c7be76064b98316e71518b8bc084795fc317eaea83db41cc87b6839ed1e09c95b6988390a2bb53980755b9a458fafdcabca51595"' }>
                                            <span class="icon ion-md-swap"></span>
                                            <span>Controllers</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="controllers-links-module-YieldConfigModule-c248027b66a194ab44745e24c7be76064b98316e71518b8bc084795fc317eaea83db41cc87b6839ed1e09c95b6988390a2bb53980755b9a458fafdcabca51595"' :
                                            'id="xs-controllers-links-module-YieldConfigModule-c248027b66a194ab44745e24c7be76064b98316e71518b8bc084795fc317eaea83db41cc87b6839ed1e09c95b6988390a2bb53980755b9a458fafdcabca51595"' }>
                                            <li class="link">
                                                <a href="controllers/YieldConfigController.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >YieldConfigController</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-YieldConfigModule-c248027b66a194ab44745e24c7be76064b98316e71518b8bc084795fc317eaea83db41cc87b6839ed1e09c95b6988390a2bb53980755b9a458fafdcabca51595"' : 'data-bs-target="#xs-injectables-links-module-YieldConfigModule-c248027b66a194ab44745e24c7be76064b98316e71518b8bc084795fc317eaea83db41cc87b6839ed1e09c95b6988390a2bb53980755b9a458fafdcabca51595"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-YieldConfigModule-c248027b66a194ab44745e24c7be76064b98316e71518b8bc084795fc317eaea83db41cc87b6839ed1e09c95b6988390a2bb53980755b9a458fafdcabca51595"' :
                                        'id="xs-injectables-links-module-YieldConfigModule-c248027b66a194ab44745e24c7be76064b98316e71518b8bc084795fc317eaea83db41cc87b6839ed1e09c95b6988390a2bb53980755b9a458fafdcabca51595"' }>
                                        <li class="link">
                                            <a href="injectables/YieldConfigService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >YieldConfigService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                </ul>
                </li>
                        <li class="chapter">
                            <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#controllers-links"' :
                                'data-bs-target="#xs-controllers-links"' }>
                                <span class="icon ion-md-swap"></span>
                                <span>Controllers</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                            <ul class="links collapse " ${ isNormalMode ? 'id="controllers-links"' : 'id="xs-controllers-links"' }>
                                <li class="link">
                                    <a href="controllers/DeviceGroupController.html" data-type="entity-link" >DeviceGroupController</a>
                                </li>
                            </ul>
                        </li>
                        <li class="chapter">
                            <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#entities-links"' :
                                'data-bs-target="#xs-entities-links"' }>
                                <span class="icon ion-ios-apps"></span>
                                <span>Entities</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                            <ul class="links collapse " ${ isNormalMode ? 'id="entities-links"' : 'id="xs-entities-links"' }>
                                <li class="link">
                                    <a href="entities/ACLModulePermissions.html" data-type="entity-link" >ACLModulePermissions</a>
                                </li>
                                <li class="link">
                                    <a href="entities/AClModules.html" data-type="entity-link" >AClModules</a>
                                </li>
                                <li class="link">
                                    <a href="entities/AggregateMeterRead.html" data-type="entity-link" >AggregateMeterRead</a>
                                </li>
                                <li class="link">
                                    <a href="entities/ApiUserEntity.html" data-type="entity-link" >ApiUserEntity</a>
                                </li>
                                <li class="link">
                                    <a href="entities/CheckCertificateIssueDateLogForDeviceEntity.html" data-type="entity-link" >CheckCertificateIssueDateLogForDeviceEntity</a>
                                </li>
                                <li class="link">
                                    <a href="entities/CheckCertificateIssueDateLogForDeviceGroupEntity.html" data-type="entity-link" >CheckCertificateIssueDateLogForDeviceGroupEntity</a>
                                </li>
                                <li class="link">
                                    <a href="entities/DeltaFirstRead.html" data-type="entity-link" >DeltaFirstRead</a>
                                </li>
                                <li class="link">
                                    <a href="entities/Device.html" data-type="entity-link" >Device</a>
                                </li>
                                <li class="link">
                                    <a href="entities/DeviceCsvFileProcessingJobsEntity.html" data-type="entity-link" >DeviceCsvFileProcessingJobsEntity</a>
                                </li>
                                <li class="link">
                                    <a href="entities/DeviceCsvProcessingFailedRowsEntity.html" data-type="entity-link" >DeviceCsvProcessingFailedRowsEntity</a>
                                </li>
                                <li class="link">
                                    <a href="entities/DeviceGroup.html" data-type="entity-link" >DeviceGroup</a>
                                </li>
                                <li class="link">
                                    <a href="entities/DeviceGroupNextIssueCertificate.html" data-type="entity-link" >DeviceGroupNextIssueCertificate</a>
                                </li>
                                <li class="link">
                                    <a href="entities/EmailConfirmation.html" data-type="entity-link" >EmailConfirmation</a>
                                </li>
                                <li class="link">
                                    <a href="entities/File.html" data-type="entity-link" >File</a>
                                </li>
                                <li class="link">
                                    <a href="entities/HistoryDeviceGroupNextIssueCertificate.html" data-type="entity-link" >HistoryDeviceGroupNextIssueCertificate</a>
                                </li>
                                <li class="link">
                                    <a href="entities/HistoryIntermediate_MeterRead.html" data-type="entity-link" >HistoryIntermediate_MeterRead</a>
                                </li>
                                <li class="link">
                                    <a href="entities/Invitation.html" data-type="entity-link" >Invitation</a>
                                </li>
                                <li class="link">
                                    <a href="entities/IrecDevicesInformationEntity.html" data-type="entity-link" >IrecDevicesInformationEntity</a>
                                </li>
                                <li class="link">
                                    <a href="entities/IrecErrorLogInformationEntity.html" data-type="entity-link" >IrecErrorLogInformationEntity</a>
                                </li>
                                <li class="link">
                                    <a href="entities/OauthClientCredentials.html" data-type="entity-link" >OauthClientCredentials</a>
                                </li>
                                <li class="link">
                                    <a href="entities/Organization.html" data-type="entity-link" >Organization</a>
                                </li>
                                <li class="link">
                                    <a href="entities/SdgBenefit.html" data-type="entity-link" >SdgBenefit</a>
                                </li>
                                <li class="link">
                                    <a href="entities/SdgBenefitDTO.html" data-type="entity-link" >SdgBenefitDTO</a>
                                </li>
                                <li class="link">
                                    <a href="entities/User.html" data-type="entity-link" >User</a>
                                </li>
                                <li class="link">
                                    <a href="entities/UserRole.html" data-type="entity-link" >UserRole</a>
                                </li>
                                <li class="link">
                                    <a href="entities/YieldConfig.html" data-type="entity-link" >YieldConfig</a>
                                </li>
                            </ul>
                        </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#classes-links"' :
                            'data-bs-target="#xs-classes-links"' }>
                            <span class="icon ion-ios-paper"></span>
                            <span>Classes</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="classes-links"' : 'id="xs-classes-links"' }>
                            <li class="link">
                                <a href="classes/ACLModuleDTO.html" data-type="entity-link" >ACLModuleDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/addDeveloperExternalId1676611071793.html" data-type="entity-link" >addDeveloperExternalId1676611071793</a>
                            </li>
                            <li class="link">
                                <a href="classes/addDeviceTimezone1683267973604.html" data-type="entity-link" >addDeviceTimezone1683267973604</a>
                            </li>
                            <li class="link">
                                <a href="classes/AddGroupDTO.html" data-type="entity-link" >AddGroupDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/AddNewFieldDeviceLog1665143885251.html" data-type="entity-link" >AddNewFieldDeviceLog1665143885251</a>
                            </li>
                            <li class="link">
                                <a href="classes/addReservationActiveCloumn1683004757319.html" data-type="entity-link" >addReservationActiveCloumn1683004757319</a>
                            </li>
                            <li class="link">
                                <a href="classes/AlreadyPartOfOrganizationError.html" data-type="entity-link" >AlreadyPartOfOrganizationError</a>
                            </li>
                            <li class="link">
                                <a href="classes/alterDevicesAndCreateIrecDevicesInfo1690172985738.html" data-type="entity-link" >alterDevicesAndCreateIrecDevicesInfo1690172985738</a>
                            </li>
                            <li class="link">
                                <a href="classes/AmountFormattingDTO.html" data-type="entity-link" >AmountFormattingDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/apiUserIdtableandcolumn1695380379771.html" data-type="entity-link" >apiUserIdtableandcolumn1695380379771</a>
                            </li>
                            <li class="link">
                                <a href="classes/ApiUserPermissionUpdateDTO.html" data-type="entity-link" >ApiUserPermissionUpdateDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/BaseReadServiceForCi.html" data-type="entity-link" >BaseReadServiceForCi</a>
                            </li>
                            <li class="link">
                                <a href="classes/BindBlockchainAccountDTO.html" data-type="entity-link" >BindBlockchainAccountDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/BuyerDeviceFilterDTO.html" data-type="entity-link" >BuyerDeviceFilterDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/CertificatelogResponse.html" data-type="entity-link" >CertificatelogResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/certificateTransactionUID1678690129095.html" data-type="entity-link" >certificateTransactionUID1678690129095</a>
                            </li>
                            <li class="link">
                                <a href="classes/CertificateWithPerdevicelog.html" data-type="entity-link" >CertificateWithPerdevicelog</a>
                            </li>
                            <li class="link">
                                <a href="classes/CheckcretificatelogforDeviceField1662610170745.html" data-type="entity-link" >CheckcretificatelogforDeviceField1662610170745</a>
                            </li>
                            <li class="link">
                                <a href="classes/CheckcretificatelogforDeviceGroupField1663162320749.html" data-type="entity-link" >CheckcretificatelogforDeviceGroupField1663162320749</a>
                            </li>
                            <li class="link">
                                <a href="classes/cleanUpDtofield1681978992039.html" data-type="entity-link" >cleanUpDtofield1681978992039</a>
                            </li>
                            <li class="link">
                                <a href="classes/ClientPasswordStrategy.html" data-type="entity-link" >ClientPasswordStrategy</a>
                            </li>
                            <li class="link">
                                <a href="classes/CodeNameDTO.html" data-type="entity-link" >CodeNameDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/CountryCodeNameDTO.html" data-type="entity-link" >CountryCodeNameDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateUserORGDTO.html" data-type="entity-link" >CreateUserORGDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/CSVBulkUploadDTO.html" data-type="entity-link" >CSVBulkUploadDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/DecimalPermissionValue.html" data-type="entity-link" >DecimalPermissionValue</a>
                            </li>
                            <li class="link">
                                <a href="classes/DefaultDeviceYieldValue1638197036511.html" data-type="entity-link" >DefaultDeviceYieldValue1638197036511</a>
                            </li>
                            <li class="link">
                                <a href="classes/DefaultInviteOrganizationRole1637777987884.html" data-type="entity-link" >DefaultInviteOrganizationRole1637777987884</a>
                            </li>
                            <li class="link">
                                <a href="classes/deltaFirstread1669270905713.html" data-type="entity-link" >deltaFirstread1669270905713</a>
                            </li>
                            <li class="link">
                                <a href="classes/deltaFirstread1669278431805.html" data-type="entity-link" >deltaFirstread1669278431805</a>
                            </li>
                            <li class="link">
                                <a href="classes/DeviceDTO.html" data-type="entity-link" >DeviceDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/Deviceexternalidcitext1669979907621.html" data-type="entity-link" >Deviceexternalidcitext1669979907621</a>
                            </li>
                            <li class="link">
                                <a href="classes/deviceFilterDTO.html" data-type="entity-link" >deviceFilterDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/DeviceGroupBuyerId1636639831399.html" data-type="entity-link" >DeviceGroupBuyerId1636639831399</a>
                            </li>
                            <li class="link">
                                <a href="classes/DeviceGroupByDTO.html" data-type="entity-link" >DeviceGroupByDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/DeviceGroupDTO.html" data-type="entity-link" >DeviceGroupDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/DeviceGroupIssueCertificate1661178024560.html" data-type="entity-link" >DeviceGroupIssueCertificate1661178024560</a>
                            </li>
                            <li class="link">
                                <a href="classes/DeviceGroupLeftoverReads1635859358060.html" data-type="entity-link" >DeviceGroupLeftoverReads1635859358060</a>
                            </li>
                            <li class="link">
                                <a href="classes/DeviceGroupNewFieldsForBuyerReservation1661776597766.html" data-type="entity-link" >DeviceGroupNewFieldsForBuyerReservation1661776597766</a>
                            </li>
                            <li class="link">
                                <a href="classes/DeviceGroupNewIdField1663219743369.html" data-type="entity-link" >DeviceGroupNewIdField1663219743369</a>
                            </li>
                            <li class="link">
                                <a href="classes/DeviceIdDTO.html" data-type="entity-link" >DeviceIdDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/DeviceIdsDTO.html" data-type="entity-link" >DeviceIdsDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/DeviceIntegrator1637586267810.html" data-type="entity-link" >DeviceIntegrator1637586267810</a>
                            </li>
                            <li class="link">
                                <a href="classes/DeviceMreterReadTypeField1659507181646.html" data-type="entity-link" >DeviceMreterReadTypeField1659507181646</a>
                            </li>
                            <li class="link">
                                <a href="classes/devicesdgbdatatypechange1671692507995.html" data-type="entity-link" >devicesdgbdatatypechange1671692507995</a>
                            </li>
                            <li class="link">
                                <a href="classes/devicesIdscolumn1673435097445.html" data-type="entity-link" >devicesIdscolumn1673435097445</a>
                            </li>
                            <li class="link">
                                <a href="classes/EndReservationdateDTO.html" data-type="entity-link" >EndReservationdateDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/EnumsUpdate1637747712217.html" data-type="entity-link" >EnumsUpdate1637747712217</a>
                            </li>
                            <li class="link">
                                <a href="classes/FileDto.html" data-type="entity-link" >FileDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/FileService.html" data-type="entity-link" >FileService</a>
                            </li>
                            <li class="link">
                                <a href="classes/FileUploadDto.html" data-type="entity-link" >FileUploadDto</a>
                            </li>
                            <li class="link">
                                <a href="classes/FilterDTO.html" data-type="entity-link" >FilterDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/FilterDTO-1.html" data-type="entity-link" >FilterDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/FilterKeyDTO.html" data-type="entity-link" >FilterKeyDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/filterNoOffLimit.html" data-type="entity-link" >filterNoOffLimit</a>
                            </li>
                            <li class="link">
                                <a href="classes/ForgetPasswordDTO.html" data-type="entity-link" >ForgetPasswordDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/GenerationReadingStoredEvent.html" data-type="entity-link" >GenerationReadingStoredEvent</a>
                            </li>
                            <li class="link">
                                <a href="classes/GroupedDevicesDTO.html" data-type="entity-link" >GroupedDevicesDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/GroupIDBasedFilteringDTO.html" data-type="entity-link" >GroupIDBasedFilteringDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/HistoryIntermideateFirlds1665490980305.html" data-type="entity-link" >HistoryIntermideateFirlds1665490980305</a>
                            </li>
                            <li class="link">
                                <a href="classes/HistoryNextIssuanceLog1665639446819.html" data-type="entity-link" >HistoryNextIssuanceLog1665639446819</a>
                            </li>
                            <li class="link">
                                <a href="classes/Initial1000000000000.html" data-type="entity-link" >Initial1000000000000</a>
                            </li>
                            <li class="link">
                                <a href="classes/IntermideatryTableFields1658924656241.html" data-type="entity-link" >IntermideatryTableFields1658924656241</a>
                            </li>
                            <li class="link">
                                <a href="classes/IntmediateMeterReadDTO.html" data-type="entity-link" >IntmediateMeterReadDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/InvitationDTO.html" data-type="entity-link" >InvitationDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/InviteDTO.html" data-type="entity-link" >InviteDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/IPublicAddOrganization.html" data-type="entity-link" >IPublicAddOrganization</a>
                            </li>
                            <li class="link">
                                <a href="classes/IPublicOrganization.html" data-type="entity-link" >IPublicOrganization</a>
                            </li>
                            <li class="link">
                                <a href="classes/JobFailedRowsDTO.html" data-type="entity-link" >JobFailedRowsDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/LoggedInUser.html" data-type="entity-link" >LoggedInUser</a>
                            </li>
                            <li class="link">
                                <a href="classes/LoginDataDTO.html" data-type="entity-link" >LoginDataDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/LoginResponseDTO.html" data-type="entity-link" >LoginResponseDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/LoginReturnDataDTO.html" data-type="entity-link" >LoginReturnDataDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/MatchConstraint.html" data-type="entity-link" >MatchConstraint</a>
                            </li>
                            <li class="link">
                                <a href="classes/NewACLModuleDTO.html" data-type="entity-link" >NewACLModuleDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/NewAddOrganizationDTO.html" data-type="entity-link" >NewAddOrganizationDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/NewApiUserPermissionDTO.html" data-type="entity-link" >NewApiUserPermissionDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/NewDeviceDTO.html" data-type="entity-link" >NewDeviceDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/NewDeviceGroupDTO.html" data-type="entity-link" >NewDeviceGroupDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/NewIntmediateMeterReadDTO.html" data-type="entity-link" >NewIntmediateMeterReadDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/NewOrganizationDTO.html" data-type="entity-link" >NewOrganizationDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/NewPermissionDTO.html" data-type="entity-link" >NewPermissionDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/NewReadDTO.html" data-type="entity-link" >NewReadDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/NewUpdateDeviceGroupDTO.html" data-type="entity-link" >NewUpdateDeviceGroupDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/NewUserDTO.html" data-type="entity-link" >NewUserDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/NewYieldConfigDTO.html" data-type="entity-link" >NewYieldConfigDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/OAuthClientCredential1688465279342.html" data-type="entity-link" >OAuthClientCredential1688465279342</a>
                            </li>
                            <li class="link">
                                <a href="classes/OrganizationDocumentOwnershipMismatchError.html" data-type="entity-link" >OrganizationDocumentOwnershipMismatchError</a>
                            </li>
                            <li class="link">
                                <a href="classes/OrganizationDTO.html" data-type="entity-link" >OrganizationDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/OrganizationFilterDTO.html" data-type="entity-link" >OrganizationFilterDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/OrganizationNameAlreadyTakenError.html" data-type="entity-link" >OrganizationNameAlreadyTakenError</a>
                            </li>
                            <li class="link">
                                <a href="classes/PermissionDTO.html" data-type="entity-link" >PermissionDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/PowerFormatter.html" data-type="entity-link" >PowerFormatter</a>
                            </li>
                            <li class="link">
                                <a href="classes/PublicOrganizationInfoDTO.html" data-type="entity-link" >PublicOrganizationInfoDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/ReadFilterDTO.html" data-type="entity-link" >ReadFilterDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/ReIssueCertificateDTO.html" data-type="entity-link" >ReIssueCertificateDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/renamedeviceIdtoexternalId1683279891527.html" data-type="entity-link" >renamedeviceIdtoexternalId1683279891527</a>
                            </li>
                            <li class="link">
                                <a href="classes/ReserveGroupsDTO.html" data-type="entity-link" >ReserveGroupsDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/ResponseDeviceGroupDTO.html" data-type="entity-link" >ResponseDeviceGroupDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/RoleConfigDTO.html" data-type="entity-link" >RoleConfigDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/SCHEMA1635443974235.html" data-type="entity-link" >SCHEMA1635443974235</a>
                            </li>
                            <li class="link">
                                <a href="classes/SDGBCodeNameDTO.html" data-type="entity-link" >SDGBCodeNameDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/Sdgbenefit1663329270791.html" data-type="entity-link" >Sdgbenefit1663329270791</a>
                            </li>
                            <li class="link">
                                <a href="classes/Secretkeyremove1681791249032.html" data-type="entity-link" >Secretkeyremove1681791249032</a>
                            </li>
                            <li class="link">
                                <a href="classes/Seed9999999999999.html" data-type="entity-link" >Seed9999999999999</a>
                            </li>
                            <li class="link">
                                <a href="classes/SeedUserDTO.html" data-type="entity-link" >SeedUserDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/SelectableDeviceGroupDTO.html" data-type="entity-link" >SelectableDeviceGroupDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/UngroupedDeviceDTO.html" data-type="entity-link" >UngroupedDeviceDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/UnreservedDeviceGroupsFilterDTO.html" data-type="entity-link" >UnreservedDeviceGroupsFilterDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateACLModuleDTO.html" data-type="entity-link" >UpdateACLModuleDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/updateAndcopyColumn1684472228595.html" data-type="entity-link" >updateAndcopyColumn1684472228595</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateChangePasswordDTO.html" data-type="entity-link" >UpdateChangePasswordDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/updateColumnvaluinNew1682659987637.html" data-type="entity-link" >updateColumnvaluinNew1682659987637</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateDeviceDTO.html" data-type="entity-link" >UpdateDeviceDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateDeviceGroupDTO.html" data-type="entity-link" >UpdateDeviceGroupDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/updateInviteStatusDTO.html" data-type="entity-link" >updateInviteStatusDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateMemberDTO.html" data-type="entity-link" >UpdateMemberDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateOrganizationDTO.html" data-type="entity-link" >UpdateOrganizationDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateOwnUserSettingsDTO.html" data-type="entity-link" >UpdateOwnUserSettingsDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdatePasswordDTO.html" data-type="entity-link" >UpdatePasswordDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdatePermissionDTO.html" data-type="entity-link" >UpdatePermissionDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/updateTable1682658608261.html" data-type="entity-link" >updateTable1682658608261</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateUserDTO.html" data-type="entity-link" >UpdateUserDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateUserProfileDTO.html" data-type="entity-link" >UpdateUserProfileDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpdateYieldValueDTO.html" data-type="entity-link" >UpdateYieldValueDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/UserDTO.html" data-type="entity-link" >UserDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/UserFilterDTO.html" data-type="entity-link" >UserFilterDTO</a>
                            </li>
                            <li class="link">
                                <a href="classes/UserOptionalFields1639069477849.html" data-type="entity-link" >UserOptionalFields1639069477849</a>
                            </li>
                            <li class="link">
                                <a href="classes/UserORGRegistrationData.html" data-type="entity-link" >UserORGRegistrationData</a>
                            </li>
                            <li class="link">
                                <a href="classes/UserRegistrationData.html" data-type="entity-link" >UserRegistrationData</a>
                            </li>
                            <li class="link">
                                <a href="classes/YieldConfigDTO.html" data-type="entity-link" >YieldConfigDTO</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#guards-links"' :
                            'data-bs-target="#xs-guards-links"' }>
                            <span class="icon ion-ios-lock"></span>
                            <span>Guards</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="guards-links"' : 'id="xs-guards-links"' }>
                            <li class="link">
                                <a href="guards/ActiveUserGuard.html" data-type="entity-link" >ActiveUserGuard</a>
                            </li>
                            <li class="link">
                                <a href="guards/PermissionGuard.html" data-type="entity-link" >PermissionGuard</a>
                            </li>
                            <li class="link">
                                <a href="guards/RolesGuard.html" data-type="entity-link" >RolesGuard</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#interfaces-links"' :
                            'data-bs-target="#xs-interfaces-links"' }>
                            <span class="icon ion-md-information-circle-outline"></span>
                            <span>Interfaces</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? ' id="interfaces-links"' : 'id="xs-interfaces-links"' }>
                            <li class="link">
                                <a href="interfaces/DeveloperSpecificGroupingDevicesOnlyForManagerialPurposeButNotForBuyerReservationModel.html" data-type="entity-link" >DeveloperSpecificGroupingDevicesOnlyForManagerialPurposeButNotForBuyerReservationModel</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/GenerationReadingStoredPayload.html" data-type="entity-link" >GenerationReadingStoredPayload</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IACLModuleConfig.html" data-type="entity-link" >IACLModuleConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IACLmodulsPermissions.html" data-type="entity-link" >IACLmodulsPermissions</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IaddModulePermission.html" data-type="entity-link" >IaddModulePermission</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IAggregateintermediate.html" data-type="entity-link" >IAggregateintermediate</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ICertificateMetadata.html" data-type="entity-link" >ICertificateMetadata</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IDeltaintermediate.html" data-type="entity-link" >IDeltaintermediate</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IDevice.html" data-type="entity-link" >IDevice</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IDeviceGroup.html" data-type="entity-link" >IDeviceGroup</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IDeviceGroupNextIssueCertificate.html" data-type="entity-link" >IDeviceGroupNextIssueCertificate</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IEmailConfirmation.html" data-type="entity-link" >IEmailConfirmation</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IEmailConfirmationToken.html" data-type="entity-link" >IEmailConfirmationToken</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IFullOrganization.html" data-type="entity-link" >IFullOrganization</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IFullUser.html" data-type="entity-link" >IFullUser</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IHistoryDeviceGroupNextIssueCertificate.html" data-type="entity-link" >IHistoryDeviceGroupNextIssueCertificate</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Iintermediate.html" data-type="entity-link" >Iintermediate</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IJWTPayload.html" data-type="entity-link" >IJWTPayload</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ILoggedInUser.html" data-type="entity-link" >ILoggedInUser</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IModulePermissionsConfig.html" data-type="entity-link" >IModulePermissionsConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IOrganizationInvitation.html" data-type="entity-link" >IOrganizationInvitation</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IOrganizationInvitationProperties.html" data-type="entity-link" >IOrganizationInvitationProperties</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IOrganizationUpdateMemberRole.html" data-type="entity-link" >IOrganizationUpdateMemberRole</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IRoleConfig.html" data-type="entity-link" >IRoleConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ISdgBenefit.html" data-type="entity-link" >ISdgBenefit</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ISuccessResponse.html" data-type="entity-link" >ISuccessResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IUser.html" data-type="entity-link" >IUser</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IUserProperties.html" data-type="entity-link" >IUserProperties</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IUserSeed.html" data-type="entity-link" >IUserSeed</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IYieldConfig.html" data-type="entity-link" >IYieldConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/newCertificate.html" data-type="entity-link" >newCertificate</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SuccessResponse.html" data-type="entity-link" >SuccessResponse</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#miscellaneous-links"'
                            : 'data-bs-target="#xs-miscellaneous-links"' }>
                            <span class="icon ion-ios-cube"></span>
                            <span>Miscellaneous</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="miscellaneous-links"' : 'id="xs-miscellaneous-links"' }>
                            <li class="link">
                                <a href="miscellaneous/enumerations.html" data-type="entity-link">Enums</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/functions.html" data-type="entity-link">Functions</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/typealiases.html" data-type="entity-link">Type aliases</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/variables.html" data-type="entity-link">Variables</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <a data-type="chapter-link" href="coverage.html"><span class="icon ion-ios-stats"></span>Documentation coverage</a>
                    </li>
                    <li class="divider"></li>
                    <li class="copyright">
                        Documentation generated using <a href="https://compodoc.app/" target="_blank" rel="noopener noreferrer">
                            <img data-src="images/compodoc-vectorise.png" class="img-responsive" data-type="compodoc-logo">
                        </a>
                    </li>
            </ul>
        </nav>
        `);
        this.innerHTML = tp.strings;
    }
});