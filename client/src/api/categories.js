import { request, USE_MOCKS, ApiError } from "./client";
import { mockStore } from "./mocks/store";

export async function getCategories() {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 60));
    return mockStore.categories;
  }
  return request("/categories");
}

export async function addCategory(category) {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 80));
    const nextId = Math.max(...mockStore.categories.map((c) => c.id), 0) + 1;
    const newCat = {
      id: nextId,
      name: category.name,
      active: true,
    };
    mockStore.categories.push(newCat);
    mockStore.save();
    return newCat;
  }
  return request("/categories", {
    method: "POST",
    body: JSON.stringify(category),
  });
}

export async function updateCategory(id, updates) {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 70));
    const cat = mockStore.categories.find((c) => c.id === Number(id));
    if (!cat) throw new ApiError("Category not found", 404);
    Object.assign(cat, updates);
    mockStore.save();
    return cat;
  }
  return request(`/categories/${id}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

export async function deactivateCategory(id) {
  return updateCategory(id, { active: false });
}
