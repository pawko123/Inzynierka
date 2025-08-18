export type SignInParams = { email: string; password: string };
export type SignUpParams = {
	username: string;
	email: string;
	password: string;
	repeatPassword: string;
};
export type CurrentUser = {
	id: string;
	username: string;
	email: string;
	createdAt: string;
};

export type AuthContextType = {
	token: string | null;
	loading: boolean;
	currentUser: CurrentUser | null;
	signIn: (p: SignInParams) => Promise<void>;
	register: (p: SignUpParams) => Promise<void>;
	signOut: () => Promise<void>;
	refreshCurrentUser: () => Promise<void>;
};
