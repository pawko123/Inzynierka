import { getStrings } from '../i18n';

/**
 * Translates common backend error messages to localized strings
 * @param errorMessage - The error message from the backend
 * @returns Localized error message
 */
export const translateError = (errorMessage: string): string => {
	const Resources = getStrings();
	
	// Check for common permission error patterns
	if (errorMessage.includes('User does not have permission') || 
	    errorMessage.includes('Permission denied') ||
	    errorMessage.includes('403')) {
		return Resources.CreateChannel.Errors.Permission_Denied;
	}
	
	// Check for authentication errors
	if (errorMessage.includes('Unauthorized') || 
	    errorMessage.includes('401') ||
	    errorMessage.includes('not authenticated')) {
		return Resources.Auth.Errors.Not_authenticated;
	}
	
	// Check for validation errors - keep specific messages as they may contain useful info
	if (errorMessage.includes('required') || 
	    errorMessage.includes('invalid') ||
	    errorMessage.includes('not found')) {
		return errorMessage; // Keep the original message for specific validation errors
	}
	
	// For any other errors, return generic message
	return Resources.CreateChannel.Errors.Generic;
};
