import { z } from "zod";
import { api, setCsrfToken, clearAuthSession } from "@/lib/api";
import { trackEvent, analyticsEvents } from "@/lib/analytics";
import { auth, googleProvider } from "@/lib/firebase";
import { signInWithPopup } from "firebase/auth";
import { clearAllStorage } from "@/lib/storage";

/**
 * Zod Schemas para validação rigorosa de contratos do backend.
 * Akita Mode: Nunca confie na rede. Valide ou morra.
 */
import { UserProfileSchema, type UserProfile } from "@/lib/schemas";

export type BackendUser = UserProfile;

export const loginResponseSchema = z.object({
  user: UserProfileSchema,
  csrfToken: z.string(),
});

export type LoginResponse = z.infer<typeof loginResponseSchema>;

export interface AuthUser {
  id: string;
  uid: string;
  email: string;
  name?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  onboardingCompleted?: boolean;
  isPro?: boolean;
  monthlyIncome?: number;
  financialGoal?:
    | "save"
    | "invest"
    | "debt-free"
    | "emergency"
    | "travel"
    | "house"
    | "retire";
  riskProfile?: "conservative" | "moderate" | "aggressive";
  hasEmergencyFund?: boolean;
  hasDebts?: boolean;
  initialBalance?: number;
  age?: number;
  retirementAge?: number;
  dependents?: number;
  employmentType?: "clt" | "pj";
  investmentHorizon?: string;
  businessName?: string;
  businessCnpj?: string;
  businessSector?: string;
  currentWorkspaceId?: string;
  workspaceRoles?: Record<string, string>;
  createdAt?: string;
}

/**
 * Mapeia o usuário que vem do backend (Zod schema) para o modelo do frontend (AuthUser/UserProfile).
 */
export const mapBackendUserToAuthUser = (
  backendUser: BackendUser,
): AuthUser => ({
  id: backendUser.id,
  uid: backendUser.id,
  email: backendUser.email,
  name: backendUser.name ?? "Sua Conta",
  displayName: backendUser.displayName ?? backendUser.name ?? null,
  photoURL: backendUser.photoURL ?? null,
  onboardingCompleted: backendUser.onboardingCompleted,
  monthlyIncome: backendUser.monthlyIncome || 0,
  financialGoal: backendUser.financialGoal || "save",
  riskProfile: backendUser.riskProfile || "moderate",
  hasEmergencyFund: backendUser.hasEmergencyFund || false,
  hasDebts: backendUser.hasDebts || false,
  initialBalance: backendUser.initialBalance || 0,
  isPro: backendUser.isPro || false,
  age: backendUser.age,
  retirementAge: backendUser.retirementAge,
  dependents: backendUser.dependents ?? 0,
  investmentHorizon: backendUser.investmentHorizon,
  employmentType: backendUser.employmentType || "clt",
  businessName: backendUser.businessName ?? undefined,
  businessCnpj: backendUser.businessCnpj ?? undefined,
  businessSector: backendUser.businessSector,
  currentWorkspaceId: backendUser.currentWorkspaceId,
  workspaceRoles: backendUser.workspaceRoles as Record<string, string> | undefined,
  createdAt: backendUser.createdAt,
});

/**
 * AuthService centraliza as requisições HTTP e interações com Firebase
 * relacionadas à autenticação. Isso evita que o AuthContext vire um God Component.
 */
export const AuthService = {
  fetchCurrentUser: async (): Promise<BackendUser> => {
    return await api.get<BackendUser>("/auth/me", {
      schema: UserProfileSchema,
    });
  },

  login: async (
    email: string,
    password?: string,
  ): Promise<{ user: AuthUser; csrfToken: string }> => {
    if (!password) throw new Error("Senha é obrigatória.");

    const { user: backendUser, csrfToken } = await api.post<LoginResponse>(
      "/auth/login",
      {
        email,
        password,
      },
      { schema: loginResponseSchema },
    );

    setCsrfToken(csrfToken);
    const authUser = mapBackendUserToAuthUser(backendUser);

    trackEvent(analyticsEvents.LOGIN, { method: "email", userId: authUser.id });
    return { user: authUser, csrfToken };
  },

  register: async (
    email: string,
    password: string,
    name?: string,
  ): Promise<{ user: AuthUser; csrfToken: string }> => {
    const { user: backendUser, csrfToken } = await api.post<LoginResponse>(
      "/auth/register",
      {
        email,
        password,
        name,
      },
      { schema: loginResponseSchema },
    );

    setCsrfToken(csrfToken);
    const authUser = mapBackendUserToAuthUser(backendUser);

    trackEvent(analyticsEvents.SIGN_UP, { userId: authUser.id });
    return { user: authUser, csrfToken };
  },

  loginWithGoogle: async (): Promise<{ user: AuthUser; csrfToken: string }> => {
    const result = await signInWithPopup(auth, googleProvider);
    const idToken = await result.user.getIdToken();

    const { user: backendUser, csrfToken } = await api.post<LoginResponse>(
      "/auth/google",
      {
        token: idToken,
      },
      { schema: loginResponseSchema },
    );

    setCsrfToken(csrfToken);
    const authUser = mapBackendUserToAuthUser(backendUser);

    trackEvent(analyticsEvents.LOGIN, {
      method: "google",
      userId: authUser.id,
    });
    return { user: authUser, csrfToken };
  },

  logout: async (): Promise<void> => {
    trackEvent(analyticsEvents.LOGOUT);
    try {
      await api.post<{ success: boolean }>("/auth/logout", {});
    } catch {
      // Ignoramos falhas no logout do servidor para garantir que o cliente limpe o estado local
    }
    clearAuthSession();
    setCsrfToken(null);
    clearAllStorage();
  },

  deleteAccount: async (): Promise<void> => {
    try {
      await api.delete<{ success: boolean }>("/users/me");
      trackEvent("account_deleted");
    } catch (error) {
      console.error("Falha ao deletar conta", error);
      throw error;
    }
    clearAuthSession();
    setCsrfToken(null);
    clearAllStorage();
  },

  updateProfile: async (data: Partial<UserProfile>): Promise<void> => {
    // 🚀 AKITA MODE: Validar o payload parcial antes de enviar
    const validatedData = UserProfileSchema.partial().parse(data);
    await api.put("/users/me", validatedData);
    trackEvent(analyticsEvents.UPDATE_PROFILE);
  },

  upgradeToPro: async (): Promise<boolean> => {
    const upgradeResponseSchema = z.object({
      success: z.boolean(),
      user: UserProfileSchema.optional(),
    });

    const res = await api.post<z.infer<typeof upgradeResponseSchema>>(
      "/auth/upgrade",
      {},
      {
        schema: upgradeResponseSchema,
      },
    );
    return res.success;
  },
};
