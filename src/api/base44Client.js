import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

//Create a client with authentication required
export const base44 = createClient({
  appId,
  token,
  functionsVersion,
  serverUrl: 'https://preview--shapeless-smart-faktura-flow.base44.app/api/apps/69dae8dccd4c1b175f393d48',
  requiresAuth: true,
  appBaseUrl
});