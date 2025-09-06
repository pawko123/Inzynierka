export interface Server {
	id: string;
	name: string;
	logo: string | null;
	haveLogo?: boolean;
}

export interface DirectChannel {
	id: string;
	name: string;
	type: string;
}
