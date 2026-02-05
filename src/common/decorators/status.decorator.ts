import { SetMetadata } from '@nestjs/common';
import { Account, Onboarding } from '../enum/account.enum';


export const ACCOUNT_KEY = 'account';
export const AccountStatus = (...account: Account[]) => SetMetadata(ACCOUNT_KEY, account);


export const ONBOARDING_KEY = 'onboarding';
export const OnboardingStatus = (...onboarding: Onboarding[]) => SetMetadata(ONBOARDING_KEY, onboarding);