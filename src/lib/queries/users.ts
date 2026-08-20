import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Role } from "@prisma/client";

export interface UserRow {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  createdAt: string;
}

export const usersQueryKey = ["admin", "users"] as const;

async function fetchUsers(): Promise<UserRow[]> {
  const res = await fetch("/api/users");
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Could not load users");
  return data.users.map((u: UserRow) => ({ ...u, createdAt: u.createdAt }));
}

export function prefetchUsers(queryClient: QueryClient) {
  return queryClient.prefetchQuery({ queryKey: usersQueryKey, queryFn: fetchUsers });
}

export function useUsers(initialData?: UserRow[]) {
  return useQuery({
    queryKey: usersQueryKey,
    queryFn: fetchUsers,
    initialData,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: Role }) => {
      const res = await fetch(`/api/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not update role");
      return { userId, role };
    },
    onSuccess: ({ userId, role }) => {
      queryClient.setQueryData<UserRow[]>(usersQueryKey, (users) =>
        users?.map((user) => (user.id === userId ? { ...user, role } : user))
      );
      toast.success(`Role updated to ${role}.`);
    },
  });
}
