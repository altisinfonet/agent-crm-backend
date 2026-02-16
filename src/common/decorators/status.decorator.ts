import { SetMetadata } from '@nestjs/common';
import { Account, Approve, Onboarding } from '../enum/account.enum';


export const ACCOUNT_KEY = 'account';
export const AccountStatus = (...account: Account[]) => SetMetadata(ACCOUNT_KEY, account);

export const APPROVAL_KEY = 'approve';
export const ApprovalStatus = (...approve: Approve[]) => SetMetadata(APPROVAL_KEY, approve);

export const ONBOARDING_KEY = 'onboarding';
export const OnboardingStatus = (...onboarding: Onboarding[]) => SetMetadata(ONBOARDING_KEY, onboarding);