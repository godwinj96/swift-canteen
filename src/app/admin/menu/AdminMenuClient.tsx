"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card } from "@/components/ui/Card";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { formatNaira } from "@/lib/currency";
import {
  useCategories,
  useAdminMenuItems,
  useCreateCategory,
  useCreateMenuItem,
  useToggleMenuItemAvailability,
  useDeleteMenuItem,
  type Category,
  type MenuItemData,
} from "@/lib/queries/menu";

export function AdminMenuClient({
  categories: initialCategories,
  menuItems: initialMenuItems,
}: {
  categories: Category[];
  menuItems: MenuItemData[];
}) {
  const { data: categories = initialCategories } = useCategories(initialCategories);
  const { data: menuItems = initialMenuItems } = useAdminMenuItems(initialMenuItems);

  const createCategory = useCreateCategory();
  const createMenuItem = useCreateMenuItem();
  const toggleAvailability = useToggleMenuItemAvailability();
  const deleteMenuItem = useDeleteMenuItem();

  const [categoryName, setCategoryName] = useState("");
  const [itemForm, setItemForm] = useState({
    name: "",
    description: "",
    price: "",
    categoryId: initialCategories[0]?.id ?? "",
    imageUrl: "",
  });

  async function handleCreateCategory(e: FormEvent) {
    e.preventDefault();
    try {
      await createCategory.mutateAsync(categoryName);
      setCategoryName("");
    } catch {
      // surfaced via the global mutation error toast
    }
  }

  async function handleCreateItem(e: FormEvent) {
    e.preventDefault();
    try {
      await createMenuItem.mutateAsync({
        name: itemForm.name,
        description: itemForm.description || undefined,
        price: parseFloat(itemForm.price),
        categoryId: itemForm.categoryId,
        imageUrl: itemForm.imageUrl || undefined,
      });
      setItemForm({ name: "", description: "", price: "", categoryId: categories[0]?.id ?? "", imageUrl: "" });
    } catch {
      // surfaced via the global mutation error toast
    }
  }

  return (
    <div>
      <span className="text-[13px] font-semibold tracking-[0.08em] text-canteen uppercase">
        Menu
      </span>
      <h1 className="font-display mt-2 mb-8 text-4xl tracking-tight text-ink">Menu Management</h1>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-semibold text-ink">Add category</h2>
          <form onSubmit={handleCreateCategory} className="flex gap-2">
            <Input
              placeholder="Category name"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              required
            />
            <Button type="submit" disabled={createCategory.isPending}>
              Add
            </Button>
          </form>
        </Card>

        <Card>
          <h2 className="mb-3 font-semibold text-ink">Add menu item</h2>
          <form onSubmit={handleCreateItem} className="flex flex-col gap-2">
            <Input
              placeholder="Item name"
              value={itemForm.name}
              onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
              required
            />
            <Input
              placeholder="Description"
              value={itemForm.description}
              onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
            />
            <Input
              placeholder="Image URL"
              value={itemForm.imageUrl}
              onChange={(e) => setItemForm({ ...itemForm, imageUrl: e.target.value })}
            />
            <div className="flex gap-2">
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="Price"
                value={itemForm.price}
                onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
                required
              />
              <Select
                value={itemForm.categoryId}
                onChange={(e) => setItemForm({ ...itemForm, categoryId: e.target.value })}
                required
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
            <Button type="submit" disabled={createMenuItem.isPending}>
              Add item
            </Button>
          </form>
        </Card>
      </div>

      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Name</TableHeaderCell>
            <TableHeaderCell>Category</TableHeaderCell>
            <TableHeaderCell>Price</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell>Actions</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {menuItems.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.name}</TableCell>
              <TableCell>{item.categoryName}</TableCell>
              <TableCell>{formatNaira(item.price)}</TableCell>
              <TableCell>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    item.isAvailable ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  }`}
                >
                  {item.isAvailable ? "Available" : "Unavailable"}
                </span>
              </TableCell>
              <TableCell className="flex gap-2">
                <button
                  onClick={() => toggleAvailability.mutate({ id: item.id, isAvailable: !item.isAvailable })}
                  className="text-xs font-medium text-canteen hover:underline"
                >
                  {item.isAvailable ? "Mark unavailable" : "Mark available"}
                </button>
                <button
                  onClick={() => deleteMenuItem.mutate(item.id)}
                  className="text-xs font-medium text-red-600 hover:underline"
                >
                  Delete
                </button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
