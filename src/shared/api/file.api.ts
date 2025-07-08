import axiosInstance from './instances/axios-auth-instance';
import BaseApi from './base';
import { FileBackend, FolderBackend } from '../data/models/File';

class FileApi extends BaseApi {
  constructor() {
    super(axiosInstance);
  }

  async uploadAvatar(userId: string, file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);

    const avatarFolderName = await this.getOrCreateAvatarFolder(userId);
    formData.append('folder', avatarFolderName);

    formData.append('filename_disk', `avatar/${userId}`);
    formData.append('uploaded_by', userId);
    
    const { data: responseData } = await this.apiInstance.post<{ data: FileBackend}>(`/files`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      withCredentials: true,
    });

    return responseData.data.id;
  }

  private async getOrCreateAvatarFolder(userId: string): Promise<string> {
    const folderName = `${userId}`;

    const searchRes = await this.apiInstance.get<{data: FolderBackend[]}>(`/folders`, {
      params: {
        filter: {
          name: { _eq: folderName }
        },
        limit: 1
      },
      withCredentials: true
    });

    if (searchRes.data.data.length > 0) {
      return searchRes.data.data[0].id;
    }

    // let avatarFolder
    // const searchAvatarRes = await this.apiInstance.get(`/folders`, {
    //   params: {
    //     filter: {
    //       name: { _eq: "avatar" }
    //     },
    //     limit: 1
    //   },
    //   withCredentials: true
    // });

    // if (!searchAvatarRes) {
    //   const createAvatar = await this.apiInstance.post(`/folders`, {
    //     name: "avatar",
    //   }, { withCredentials: true });

    //   avatarFolder = createAvatar.data.data
    // } else {
    //   avatarFolder = searchAvatarRes.data.datap[0]
    // }

    const createRes = await this.apiInstance.post<{ data: FolderBackend }>(`/folders`, {
      name: folderName,
      // parent: avatarFolder
    }, { withCredentials: true });

    return createRes.data.data.id;
  }

  async deleteFile(fileId: string): Promise<void> {
    await this.apiInstance.delete(`/files/${fileId}`, {
      withCredentials: true
    });
  }

  async getFile(fileId: string): Promise<FileBackend> {
    const { data: responseData } = await this.apiInstance.get<{ data: FileBackend }>(`/files/${fileId}`, {
      withCredentials: true,
    });
    return responseData.data;
  }
  
}

export const fileApi = new FileApi();
