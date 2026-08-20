import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";

export interface Category {
  id: string;
  name: string;
  description: string | null;
}

export interface MenuItemData {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isAvailable: boolean;
  categoryId: string;
  categoryName: string;
}

interface RawMenuItem {
  id: string;
  name: string;
  description: string | null;
  price: string | number;
  imageUrl: string | null;
  isAvailable: boolean;
  categoryId: string;
  category: { name: string };
}

function normalizeMenuItem(item: RawMenuItem): MenuItemData {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    price: Number(item.price),
    imageUrl: item.imageUrl,
    isAvailable: item.isAvailable,
    categoryId: item.categoryId,
    categoryName: item.category.name,
  };
}

export const categoriesQueryKey = ["admin", "categories"] as const;
export const adminMenuItemsQueryKey = ["admin", "menuItems"] as const;

async function fetchCategories(): Promise<Category[]> {
  const res = await fetch("/api/categories");
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Could not load categories");
  return data.categories.map((c: { id: string; name: string; description: string | null }) => ({
    id: c.id,
    name: c.name,
    description: c.description,
  }));
}

async function fetchAdminMenuItems(): Promise<MenuItemData[]> {
  const res = await fetch("/api/menu-items");
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Could not load menu items");
  return data.menuItems.map(normalizeMenuItem);
}

export function prefetchMenu(queryClient: QueryClient) {
  return Promise.all([
    queryClient.prefetchQuery({ queryKey: categoriesQueryKey, queryFn: fetchCategories }),
    queryClient.prefetchQuery({ queryKey: adminMenuItemsQueryKey, queryFn: fetchAdminMenuItems }),
  ]);
}

export function useCategories(initialData?: Category[]) {
  return useQuery({ queryKey: categoriesQueryKey, queryFn: fetchCategories, initialData });
}

export function useAdminMenuItems(initialData?: MenuItemData[]) {
  return useQuery({ queryKey: adminMenuItemsQueryKey, queryFn: fetchAdminMenuItems, initialData });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not create category");
      return data.category as Category;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoriesQueryKey });
    },
  });
}

export interface CreateMenuItemInput {
  name: string;
  description?: string;
  price: number;
  categoryId: string;
  imageUrl?: string;
}

export function useCreateMenuItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateMenuItemInput) => {
      const res = await fetch("/api/menu-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not create item");
      return data.menuItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminMenuItemsQueryKey });
    },
  });
}

export interface UpdateMenuItemInput {
  id: string;
  name: string;
  description?: string;
  price: number;
  categoryId: string;
  imageUrl?: string;
}

export function useUpdateMenuItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateMenuItemInput) => {
      const res = await fetch(`/api/menu-items/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not update item");
      return data.menuItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminMenuItemsQueryKey });
    },
  });
}

export function useToggleMenuItemAvailability() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isAvailable }: { id: string; isAvailable: boolean }) => {
      const res = await fetch(`/api/menu-items/${id}/availability`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not update item availability");
      return { id, isAvailable };
    },
    onSuccess: ({ id, isAvailable }) => {
      queryClient.setQueryData<MenuItemData[]>(adminMenuItemsQueryKey, (items) =>
        items?.map((item) => (item.id === id ? { ...item, isAvailable } : item))
      );
    },
  });
}

export function useDeleteMenuItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/menu-items/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Could not delete item");
      }
      return id;
    },
    onSuccess: (id) => {
      queryClient.setQueryData<MenuItemData[]>(adminMenuItemsQueryKey, (items) =>
        items?.filter((item) => item.id !== id)
      );
    },
  });
}
