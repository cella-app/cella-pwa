import { meApi } from '@/shared/api/me.api';
import { User } from '@/shared/data/models/User';
import { fileApi } from '@/shared/api/file.api';
import { userAlertStore, SERVERIFY_ALERT } from '@/features/alert/stores/alert.store';


export async function getAvatarUrl(avatarId: string): Promise<string | undefined> {
  if (!avatarId) return undefined;
  
  // Use Next.js API proxy instead of direct Directus assets URL
  return `/api/avatar/${avatarId}`;
}

export async function getMe(): Promise<User & { avatar_url?: string, avatar_filename_disk?: string }> {
  const user = await meApi.get();
  let avatar_url: string | undefined = undefined;

  if (user && user.avatar) {
    avatar_url = await getAvatarUrl(user.avatar);
  }
  return { ...user, avatar_url };
}

export async function updateAvatarWithDelete(user: User, newFile: File): Promise<ReturnType<typeof getMe>> {
  if (user.avatar && typeof user.avatar === 'string') {
    try {
      await fileApi.deleteFile(user.avatar);
    } catch {
    }
  }
  // Upload new avatar
  const fileId = await fileApi.uploadAvatar(user.id, newFile);
  await meApi.updateAvatar(user.id, { avatar: fileId });
  return await getMe();
}

export async function updateInfo(user: User, firstName: string, lastName: string): Promise<ReturnType<typeof getMe>> {
  try {
    await meApi.updateInfo(user.id, { first_name: firstName, last_name: lastName });
    return await getMe();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    userAlertStore.getState().addAlert({
      severity: SERVERIFY_ALERT.ERROR,
      message: err?.message || 'Failed to update user info',
    });
    throw err;
  }
} 