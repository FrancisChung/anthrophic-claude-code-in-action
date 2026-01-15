import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useAuth } from "../use-auth";

// Mock dependencies
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

const mockSignInAction = vi.fn();
const mockSignUpAction = vi.fn();
vi.mock("@/actions", () => ({
  signIn: (email: string, password: string) => mockSignInAction(email, password),
  signUp: (email: string, password: string) => mockSignUpAction(email, password),
}));

const mockGetAnonWorkData = vi.fn();
const mockClearAnonWork = vi.fn();
vi.mock("@/lib/anon-work-tracker", () => ({
  getAnonWorkData: () => mockGetAnonWorkData(),
  clearAnonWork: () => mockClearAnonWork(),
}));

const mockGetProjects = vi.fn();
vi.mock("@/actions/get-projects", () => ({
  getProjects: () => mockGetProjects(),
}));

const mockCreateProject = vi.fn();
vi.mock("@/actions/create-project", () => ({
  createProject: (data: any) => mockCreateProject(data),
}));

describe("useAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("initial state", () => {
    it("returns isLoading as false initially", () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current.isLoading).toBe(false);
    });

    it("returns signIn and signUp functions", () => {
      const { result } = renderHook(() => useAuth());

      expect(typeof result.current.signIn).toBe("function");
      expect(typeof result.current.signUp).toBe("function");
    });
  });

  describe("signIn", () => {
    describe("happy path", () => {
      it("calls signInAction with email and password", async () => {
        mockSignInAction.mockResolvedValue({ success: true });
        mockGetAnonWorkData.mockReturnValue(null);
        mockGetProjects.mockResolvedValue([{ id: "project-1" }]);

        const { result } = renderHook(() => useAuth());

        await act(async () => {
          await result.current.signIn("test@example.com", "password123");
        });

        expect(mockSignInAction).toHaveBeenCalledWith(
          "test@example.com",
          "password123"
        );
      });

      it("sets isLoading to true during sign in and false after", async () => {
        let resolveSignIn: (value: any) => void;
        const signInPromise = new Promise((resolve) => {
          resolveSignIn = resolve;
        });
        mockSignInAction.mockReturnValue(signInPromise);
        mockGetAnonWorkData.mockReturnValue(null);
        mockGetProjects.mockResolvedValue([{ id: "project-1" }]);

        const { result } = renderHook(() => useAuth());

        expect(result.current.isLoading).toBe(false);

        let signInResultPromise: Promise<any>;
        act(() => {
          signInResultPromise = result.current.signIn(
            "test@example.com",
            "password123"
          );
        });

        await waitFor(() => {
          expect(result.current.isLoading).toBe(true);
        });

        await act(async () => {
          resolveSignIn!({ success: true });
          await signInResultPromise;
        });

        expect(result.current.isLoading).toBe(false);
      });

      it("returns the result from signInAction", async () => {
        mockSignInAction.mockResolvedValue({ success: true });
        mockGetAnonWorkData.mockReturnValue(null);
        mockGetProjects.mockResolvedValue([{ id: "project-1" }]);

        const { result } = renderHook(() => useAuth());

        let signInResult: any;
        await act(async () => {
          signInResult = await result.current.signIn(
            "test@example.com",
            "password123"
          );
        });

        expect(signInResult).toEqual({ success: true });
      });

      it("redirects to most recent project on successful sign in", async () => {
        mockSignInAction.mockResolvedValue({ success: true });
        mockGetAnonWorkData.mockReturnValue(null);
        mockGetProjects.mockResolvedValue([
          { id: "project-recent" },
          { id: "project-old" },
        ]);

        const { result } = renderHook(() => useAuth());

        await act(async () => {
          await result.current.signIn("test@example.com", "password123");
        });

        expect(mockPush).toHaveBeenCalledWith("/project-recent");
      });
    });

    describe("with anonymous work", () => {
      it("creates a project with anonymous work data", async () => {
        const anonData = {
          messages: [{ role: "user", content: "Hello" }],
          fileSystemData: { "/": { type: "directory" } },
        };
        mockSignInAction.mockResolvedValue({ success: true });
        mockGetAnonWorkData.mockReturnValue(anonData);
        mockCreateProject.mockResolvedValue({ id: "new-project-123" });

        const { result } = renderHook(() => useAuth());

        await act(async () => {
          await result.current.signIn("test@example.com", "password123");
        });

        expect(mockCreateProject).toHaveBeenCalledWith({
          name: expect.stringContaining("Design from"),
          messages: anonData.messages,
          data: anonData.fileSystemData,
        });
      });

      it("clears anonymous work after creating project", async () => {
        mockSignInAction.mockResolvedValue({ success: true });
        mockGetAnonWorkData.mockReturnValue({
          messages: [{ role: "user", content: "Hello" }],
          fileSystemData: {},
        });
        mockCreateProject.mockResolvedValue({ id: "new-project-123" });

        const { result } = renderHook(() => useAuth());

        await act(async () => {
          await result.current.signIn("test@example.com", "password123");
        });

        expect(mockClearAnonWork).toHaveBeenCalled();
      });

      it("redirects to newly created project from anonymous work", async () => {
        mockSignInAction.mockResolvedValue({ success: true });
        mockGetAnonWorkData.mockReturnValue({
          messages: [{ role: "user", content: "Hello" }],
          fileSystemData: {},
        });
        mockCreateProject.mockResolvedValue({ id: "anon-project-456" });

        const { result } = renderHook(() => useAuth());

        await act(async () => {
          await result.current.signIn("test@example.com", "password123");
        });

        expect(mockPush).toHaveBeenCalledWith("/anon-project-456");
      });

      it("ignores anonymous work with empty messages", async () => {
        mockSignInAction.mockResolvedValue({ success: true });
        mockGetAnonWorkData.mockReturnValue({
          messages: [],
          fileSystemData: {},
        });
        mockGetProjects.mockResolvedValue([{ id: "existing-project" }]);

        const { result } = renderHook(() => useAuth());

        await act(async () => {
          await result.current.signIn("test@example.com", "password123");
        });

        expect(mockCreateProject).not.toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalledWith("/existing-project");
      });
    });

    describe("without existing projects", () => {
      it("creates a new project if user has no projects", async () => {
        mockSignInAction.mockResolvedValue({ success: true });
        mockGetAnonWorkData.mockReturnValue(null);
        mockGetProjects.mockResolvedValue([]);
        mockCreateProject.mockResolvedValue({ id: "brand-new-project" });

        const { result } = renderHook(() => useAuth());

        await act(async () => {
          await result.current.signIn("test@example.com", "password123");
        });

        expect(mockCreateProject).toHaveBeenCalledWith({
          name: expect.stringMatching(/^New Design #\d+$/),
          messages: [],
          data: {},
        });
        expect(mockPush).toHaveBeenCalledWith("/brand-new-project");
      });
    });

    describe("error states", () => {
      it("does not redirect on failed sign in", async () => {
        mockSignInAction.mockResolvedValue({
          success: false,
          error: "Invalid credentials",
        });

        const { result } = renderHook(() => useAuth());

        await act(async () => {
          await result.current.signIn("test@example.com", "wrongpassword");
        });

        expect(mockPush).not.toHaveBeenCalled();
      });

      it("returns error result on failed sign in", async () => {
        mockSignInAction.mockResolvedValue({
          success: false,
          error: "Invalid credentials",
        });

        const { result } = renderHook(() => useAuth());

        let signInResult: any;
        await act(async () => {
          signInResult = await result.current.signIn(
            "test@example.com",
            "wrongpassword"
          );
        });

        expect(signInResult).toEqual({
          success: false,
          error: "Invalid credentials",
        });
      });

      it("sets isLoading to false even on error", async () => {
        mockSignInAction.mockRejectedValue(new Error("Network error"));

        const { result } = renderHook(() => useAuth());

        await act(async () => {
          try {
            await result.current.signIn("test@example.com", "password123");
          } catch {
            // Expected to throw
          }
        });

        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe("signUp", () => {
    describe("happy path", () => {
      it("calls signUpAction with email and password", async () => {
        mockSignUpAction.mockResolvedValue({ success: true });
        mockGetAnonWorkData.mockReturnValue(null);
        mockGetProjects.mockResolvedValue([{ id: "project-1" }]);

        const { result } = renderHook(() => useAuth());

        await act(async () => {
          await result.current.signUp("newuser@example.com", "password123");
        });

        expect(mockSignUpAction).toHaveBeenCalledWith(
          "newuser@example.com",
          "password123"
        );
      });

      it("sets isLoading to true during sign up and false after", async () => {
        let resolveSignUp: (value: any) => void;
        const signUpPromise = new Promise((resolve) => {
          resolveSignUp = resolve;
        });
        mockSignUpAction.mockReturnValue(signUpPromise);
        mockGetAnonWorkData.mockReturnValue(null);
        mockGetProjects.mockResolvedValue([{ id: "project-1" }]);

        const { result } = renderHook(() => useAuth());

        expect(result.current.isLoading).toBe(false);

        let signUpResultPromise: Promise<any>;
        act(() => {
          signUpResultPromise = result.current.signUp(
            "newuser@example.com",
            "password123"
          );
        });

        await waitFor(() => {
          expect(result.current.isLoading).toBe(true);
        });

        await act(async () => {
          resolveSignUp!({ success: true });
          await signUpResultPromise;
        });

        expect(result.current.isLoading).toBe(false);
      });

      it("returns the result from signUpAction", async () => {
        mockSignUpAction.mockResolvedValue({ success: true });
        mockGetAnonWorkData.mockReturnValue(null);
        mockGetProjects.mockResolvedValue([{ id: "project-1" }]);

        const { result } = renderHook(() => useAuth());

        let signUpResult: any;
        await act(async () => {
          signUpResult = await result.current.signUp(
            "newuser@example.com",
            "password123"
          );
        });

        expect(signUpResult).toEqual({ success: true });
      });

      it("redirects to most recent project on successful sign up", async () => {
        mockSignUpAction.mockResolvedValue({ success: true });
        mockGetAnonWorkData.mockReturnValue(null);
        mockGetProjects.mockResolvedValue([{ id: "first-project" }]);

        const { result } = renderHook(() => useAuth());

        await act(async () => {
          await result.current.signUp("newuser@example.com", "password123");
        });

        expect(mockPush).toHaveBeenCalledWith("/first-project");
      });
    });

    describe("with anonymous work", () => {
      it("creates a project with anonymous work data on sign up", async () => {
        const anonData = {
          messages: [{ role: "assistant", content: "Generated code" }],
          fileSystemData: { "/App.jsx": { type: "file", content: "code" } },
        };
        mockSignUpAction.mockResolvedValue({ success: true });
        mockGetAnonWorkData.mockReturnValue(anonData);
        mockCreateProject.mockResolvedValue({ id: "signup-project" });

        const { result } = renderHook(() => useAuth());

        await act(async () => {
          await result.current.signUp("newuser@example.com", "password123");
        });

        expect(mockCreateProject).toHaveBeenCalledWith({
          name: expect.stringContaining("Design from"),
          messages: anonData.messages,
          data: anonData.fileSystemData,
        });
        expect(mockClearAnonWork).toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalledWith("/signup-project");
      });
    });

    describe("without existing projects", () => {
      it("creates a new project for new user with no projects", async () => {
        mockSignUpAction.mockResolvedValue({ success: true });
        mockGetAnonWorkData.mockReturnValue(null);
        mockGetProjects.mockResolvedValue([]);
        mockCreateProject.mockResolvedValue({ id: "new-user-project" });

        const { result } = renderHook(() => useAuth());

        await act(async () => {
          await result.current.signUp("newuser@example.com", "password123");
        });

        expect(mockCreateProject).toHaveBeenCalledWith({
          name: expect.stringMatching(/^New Design #\d+$/),
          messages: [],
          data: {},
        });
        expect(mockPush).toHaveBeenCalledWith("/new-user-project");
      });
    });

    describe("error states", () => {
      it("does not redirect on failed sign up", async () => {
        mockSignUpAction.mockResolvedValue({
          success: false,
          error: "Email already registered",
        });

        const { result } = renderHook(() => useAuth());

        await act(async () => {
          await result.current.signUp("existing@example.com", "password123");
        });

        expect(mockPush).not.toHaveBeenCalled();
      });

      it("returns error result on failed sign up", async () => {
        mockSignUpAction.mockResolvedValue({
          success: false,
          error: "Password must be at least 8 characters",
        });

        const { result } = renderHook(() => useAuth());

        let signUpResult: any;
        await act(async () => {
          signUpResult = await result.current.signUp("test@example.com", "short");
        });

        expect(signUpResult).toEqual({
          success: false,
          error: "Password must be at least 8 characters",
        });
      });

      it("sets isLoading to false even on exception", async () => {
        mockSignUpAction.mockRejectedValue(new Error("Server error"));

        const { result } = renderHook(() => useAuth());

        await act(async () => {
          try {
            await result.current.signUp("test@example.com", "password123");
          } catch {
            // Expected to throw
          }
        });

        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe("edge cases", () => {
    it("handles null return from getAnonWorkData", async () => {
      mockSignInAction.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(null);
      mockGetProjects.mockResolvedValue([{ id: "project-1" }]);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("test@example.com", "password123");
      });

      expect(mockGetProjects).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/project-1");
    });

    it("handles concurrent sign in attempts gracefully", async () => {
      mockSignInAction.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(null);
      mockGetProjects.mockResolvedValue([{ id: "project-1" }]);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        // Start multiple sign in attempts concurrently
        await Promise.all([
          result.current.signIn("test@example.com", "password123"),
          result.current.signIn("test@example.com", "password123"),
        ]);
      });

      // Both attempts should complete, isLoading should be false
      expect(result.current.isLoading).toBe(false);
    });

    it("handles empty project list and creates new project", async () => {
      mockSignUpAction.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(null);
      mockGetProjects.mockResolvedValue([]);
      mockCreateProject.mockResolvedValue({ id: "empty-list-project" });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signUp("test@example.com", "password123");
      });

      expect(mockCreateProject).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/empty-list-project");
    });

    it("prioritizes anonymous work over existing projects", async () => {
      mockSignInAction.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue({
        messages: [{ role: "user", content: "My work" }],
        fileSystemData: {},
      });
      mockCreateProject.mockResolvedValue({ id: "anon-priority-project" });
      mockGetProjects.mockResolvedValue([{ id: "existing-project" }]);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("test@example.com", "password123");
      });

      // Should create project from anon work, not redirect to existing
      expect(mockCreateProject).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/anon-priority-project");
      // getProjects should NOT have been called since anon work takes priority
      expect(mockGetProjects).not.toHaveBeenCalled();
    });
  });
});
