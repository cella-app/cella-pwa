export interface FileBackend {
	id: string;
	storage: string;
	filename_disk: string;
	filename_download: string;
	title: string;
	type: string;
	folder: string | null;
	uploaded_by: string;
	created_on: string;
	modified_by: string | null;
	modified_on: string;
	charset: string | null;
	filesize: string;
	width: number;
	height: number;
	duration: number | null;
	embed: string | null;
	description: string | null;
	location: string | null;
	tags: string[] | null;
	metadata: {
		ifd0?: {
			Make?: string;
			Model?: string;
		};
		exif?: {
			FNumber?: number;
			ExposureTime?: number;
			FocalLength?: number;
			ISOSpeedRatings?: number;
		};
	};
	focal_point_x: number | null;
	focal_point_y: number | null;
	tus_id: string | null;
	tus_data: string | null;
	uploaded_on: string;
}


export interface FolderBackend {
	id: string;
	name: string;
	parent: string | null;
}


