import { Module, UseGuards } from '@nestjs/common';
import { APP_GUARD, RouterModule } from '@nestjs/core';
import { AdminSettingsModule } from './settings/admin-settings.module';
import { CountryModule } from './country/country.module';
import { CurrencyModule } from './currency/currency.module';
import { FaqModule } from './faq/faq.module';
import { PagesModule } from './pages/pages.module';
import { MenuModule } from './menu/menu.module';
import { ProductsModule } from './products/products.module';
import { AgentModule } from './agent/agent.module';

@Module({
    imports: [
        RouterModule.register([
            {
                path: 'admin',
                children: [
                    {
                        path: 'agent',
                        module: AgentModule,
                    },
                    {
                        path: 'country',
                        module: CountryModule,
                    },
                    {
                        path: 'currency',
                        module: CurrencyModule,
                    },
                    {
                        path: 'faq',
                        module: FaqModule,
                    },
                    {
                        path: 'menu',
                        module: MenuModule,
                    },
                    {
                        path: 'page',
                        module: PagesModule,
                    },
                    {
                        path: 'products',
                        module: ProductsModule,
                    },
                    {
                        path: 'settings',
                        module: AdminSettingsModule,
                    },
                ],
            },

        ]),
        AdminSettingsModule,
        CountryModule,
        CurrencyModule,
        FaqModule,
        PagesModule,
        MenuModule,
        ProductsModule,
        AgentModule
    ],
})
export class AdminModule { }
