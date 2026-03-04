import { Injectable, OnModuleInit } from '@nestjs/common';
import * as FCMAdmin from 'firebase-admin';
import { PrismaService } from '@/prisma/prisma.service';


@Injectable()
export class FirebaseAdminService implements OnModuleInit {
    constructor(private prisma: PrismaService) { }

    async onModuleInit() {
        await this.initializeFirebase();
    }

    private async initializeFirebase() {
        try {
            if (FCMAdmin.apps.length) return;

            const settings = await this.prisma.adminSettings.findFirst({
                where: { title: 'firebase-settings' },
            });

            if (!settings || !settings.metadata) {
                // throw new Error("App settings or metadata not found.");
                return "App settings or metadata not found.";
            }

            const metadata = settings.metadata as Record<string, any>;
            const firebasePrivateKey = metadata?.firebasePrivateKey;
            if (!firebasePrivateKey) {
                return 'Firebase private key not found.';
            }

            const firebaseCreds =
                typeof firebasePrivateKey === 'string'
                    ? JSON.parse(firebasePrivateKey)
                    : firebasePrivateKey;


            if (firebaseCreds.private_key?.includes('\\n')) {
                firebaseCreds.private_key = firebaseCreds.private_key.replace(/\\n/g, '\n');
            }

            FCMAdmin.initializeApp({
                credential: FCMAdmin.credential.cert(firebaseCreds),
            });
        } catch (error) {
            console.error(error);
        }
    }

    messaging(): FCMAdmin.messaging.Messaging {
        return FCMAdmin.messaging();
    }
}
