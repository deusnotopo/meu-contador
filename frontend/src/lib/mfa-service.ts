import { auth } from "./firebase";
import { 
  multiFactor, 
  PhoneAuthProvider, 
  PhoneMultiFactorGenerator,
  type ApplicationVerifier,
  type MultiFactorResolver,
  getMultiFactorResolver,
  type MultiFactorError
} from "firebase/auth";

/**
 * Service to handle Firebase Multi-Factor Authentication.
 */
export const MFAService = {
  /**
   * Checks if the current user has MFA enabled.
   */
  isEnabled: () => {
    const user = auth.currentUser;
    if (!user) return false;
    return multiFactor(user).enrolledFactors.length > 0;
  },

  /**
   * Starts the enrollment process for Phone MFA.
   * Returns the verification ID needed to complete enrollment.
   */
  startPhoneEnrollment: async (phoneNumber: string, recaptchaVerifier: ApplicationVerifier) => {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    const session = await multiFactor(user).getSession();
    const phoneInfoOptions = {
      phoneNumber,
      session
    };

    const phoneAuthProvider = new PhoneAuthProvider(auth);
    return phoneAuthProvider.verifyPhoneNumber(phoneInfoOptions, recaptchaVerifier);
  },

  /**
   * Completes the enrollment process.
   */
  finishEnrollment: async (verificationId: string, verificationCode: string, label: string) => {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    const cred = PhoneAuthProvider.credential(verificationId, verificationCode);
    const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(cred);
    
    await multiFactor(user).enroll(multiFactorAssertion, label);
  },

  /**
   * Handles MFA during sign-in if required.
   */
  handleMFARequired: async (error: unknown, recaptchaVerifier: ApplicationVerifier) => {
    const resolver = getMultiFactorResolver(auth, error as MultiFactorError);
    if (!resolver) throw error;

    const session = resolver.session;
    const hints = resolver.hints;
    
    // For simplicity in this mock, we assume the first factor is used
    const phoneAuthProvider = new PhoneAuthProvider(auth);
    const verificationId = await phoneAuthProvider.verifyPhoneNumber(
      { multiFactorHint: hints[0], session },
      recaptchaVerifier
    );

    return { resolver, verificationId };
  },

  /**
   * Completes sign-in after MFA verification.
   */
  finishSignIn: async (resolver: MultiFactorResolver, verificationId: string, verificationCode: string) => {
    const cred = PhoneAuthProvider.credential(verificationId, verificationCode);
    const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(cred);
    return resolver.resolveSignIn(multiFactorAssertion);
  }
};
