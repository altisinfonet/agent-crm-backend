import { Module, UseGuards } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { AdminSettingsModule } from './settings/admin-settings.module';
import { CountryModule } from './country/country.module';
import { CurrencyModule } from './currency/currency.module';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Role } from 'src/common/enum/role.enum';
import { Roles } from 'src/common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Module({
    imports: [
        RouterModule.register([
            {
                path: 'admin',
                children: [
                    {
                        path: 'country',
                        module: CountryModule,
                    },
                    {
                        path: 'currency',
                        module: CurrencyModule,
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
    ],
})
export class AdminModule { }
