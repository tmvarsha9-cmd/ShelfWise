import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit2, Check, X, Ban } from "lucide-react";
import { getCategories, addCategory, updateCategory } from "../../api/categories";
import PageHeader from "../../components/PageHeader";
import StatusChip from "../../components/StatusChip";
import Spinner from "../../components/Spinner";
import ErrorState from "../../components/ErrorState";
import { useToast } from "../../components/Toast";

export default function Categories() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [newCatName, setNewCatName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");

  const {
    data: categories = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const addMutation = useMutation({
    mutationFn: (name) => addCategory({ name }),
    onSuccess: (cat) => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      showToast(`Category "${cat.name}" added`);
      setNewCatName("");
    },
    onError: (err) => showToast(err.message, "error"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }) => updateCategory(id, updates),
    onSuccess: (cat) => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      showToast(`Category updated`);
      setEditingId(null);
    },
    onError: (err) => showToast(err.message, "error"),
  });

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    addMutation.mutate(newCatName.trim());
  };

  const startRename = (cat) => {
    setEditingId(cat.id);
    setEditName(cat.name);
  };

  const saveRename = (id) => {
    if (!editName.trim()) return;
    updateMutation.mutate({ id, updates: { name: editName.trim() } });
  };

  const toggleActive = (cat) => {
    updateMutation.mutate({ id: cat.id, updates: { active: !cat.active } });
  };

  return (
    <div>
      <PageHeader
        title="Categories"
        description="Organise items into shop departments and product lines."
      />

      {/* Inline Add Category Bar */}
      <div className="p-4 bg-surface border border-border rounded-card mb-6">
        <form onSubmit={handleAddSubmit} className="flex items-center gap-3">
          <input
            type="text"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            placeholder="Add new category (e.g. Spices, Household, Beverages)…"
            className="flex-1 max-w-md h-10 px-3 text-[14px] bg-surface border border-border-strong rounded-input outline-none focus:border-primary"
          />
          <button
            type="submit"
            disabled={addMutation.isPending || !newCatName.trim()}
            className="inline-flex items-center gap-2 h-10 px-4 text-[14px] font-semibold text-white bg-primary hover:bg-primary-hover rounded-btn transition-colors disabled:opacity-50"
          >
            {addMutation.isPending ? <Spinner size="sm" /> : <Plus className="w-4 h-4" />}
            <span>Add category</span>
          </button>
        </form>
      </div>

      {isLoading ? (
        <div className="p-12 flex justify-center bg-surface border border-border rounded-card">
          <Spinner size="md" />
        </div>
      ) : isError ? (
        <ErrorState message={error?.message} onRetry={() => refetch()} />
      ) : (
        <div className="bg-surface border border-border rounded-card overflow-hidden">
          <table className="w-full text-left text-[15px] border-collapse" aria-label="Categories table">
            <thead className="bg-surface-muted border-b border-border text-[12px] uppercase tracking-wider text-text-muted">
              <tr>
                <th className="py-3 px-4 font-semibold">Category name</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-surface-muted/30 transition-colors">
                  <td className="py-3 px-4 font-medium text-text">
                    {editingId === cat.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="h-8 px-2 text-[14px] bg-surface border border-primary rounded-input outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => saveRename(cat.id)}
                          aria-label="Save category name"
                          className="p-1.5 text-primary hover:bg-primary-subtle rounded"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          aria-label="Cancel rename"
                          className="p-1.5 text-text-muted hover:bg-surface-muted rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <span className={cat.active === false ? "line-through text-text-muted" : ""}>
                        {cat.name}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {cat.active !== false ? (
                      <StatusChip variant="ok" label="Active" />
                    ) : (
                      <StatusChip variant="neutral" label="Inactive" />
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => startRename(cat)}
                        className="p-1.5 text-text-muted hover:text-text rounded hover:bg-surface-muted transition-colors text-[13px] inline-flex items-center gap-1"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Rename</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleActive(cat)}
                        className="p-1.5 text-text-muted hover:text-status-danger rounded hover:bg-surface-muted transition-colors text-[13px] inline-flex items-center gap-1"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        <span>{cat.active !== false ? "Deactivate" : "Activate"}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
