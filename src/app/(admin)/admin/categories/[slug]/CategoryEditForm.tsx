"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import slugify from "slugify";
import FileUpload from "@/utils/FileUpload";
import { updateCategorySchema } from "@/lib/validators/category.validators";

export interface EditableCategory {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  categoryImageUrl: string | null;
  categoryImagePath: string | null;
  sizeChartImageUrl: string | null;
  sizeChartImagePath: string | null;
  isActive: boolean;
}

interface ApiEnvelope {
  success: boolean;
  message: string;
  data: unknown;
  errors?: Record<string, string[]>;
}

interface FieldErrors {
  title?: string;
  description?: string;
}

export default function CategoryEditForm({
  category,
}: {
  category: EditableCategory;
}) {
  const router = useRouter();

  const [title, setTitle] = useState(category.title);
  const [description, setDescription] = useState(category.description ?? "");
  const [isActive, setIsActive] = useState(category.isActive);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [sizeChartFile, setSizeChartFile] = useState<File | null>(null);
  const [sizeChartPreview, setSizeChartPreview] = useState<string | null>(null);

  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  const objectUrls = useRef<Set<string>>(new Set());

  const makePreview = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    objectUrls.current.add(url);
    return url;
  }, []);

  const revokePreview = useCallback((url: string | null) => {
    if (url && objectUrls.current.has(url)) {
      URL.revokeObjectURL(url);
      objectUrls.current.delete(url);
    }
  }, []);

  useEffect(() => {
    const urls = objectUrls.current;
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
      urls.clear();
    };
  }, []);

  const titleChanged = title.trim() !== category.title;
  const descriptionChanged =
    description.trim() !== (category.description ?? "").trim();
  const isActiveChanged = isActive !== category.isActive;
  const mediaChanged = imageFile !== null || sizeChartFile !== null;

  const isDirty =
    titleChanged || descriptionChanged || isActiveChanged || mediaChanged;

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const confirmLeave = useCallback(() => {
    if (!isDirty) return true;
    return window.confirm("You have unsaved changes. Leave without saving?");
  }, [isDirty]);

  const derivedSlug = title.trim()
    ? slugify(title.trim(), { lower: true, strict: true })
    : "";

  const handleImageSelect = (file: File) => {
    setImagePreview((prev) => {
      revokePreview(prev);
      return makePreview(file);
    });
    setImageFile(file);
  };

  const handleImageRemove = () => {
    if (imageFile) {
      setImagePreview((prev) => {
        revokePreview(prev);
        return null;
      });
      setImageFile(null);
      return;
    }
    toast.info("Upload a new image to replace it — removal isn't supported.");
  };

  const handleSizeChartSelect = (file: File) => {
    setSizeChartPreview((prev) => {
      revokePreview(prev);
      return makePreview(file);
    });
    setSizeChartFile(file);
  };

  const handleSizeChartRemove = () => {
    if (sizeChartFile) {
      setSizeChartPreview((prev) => {
        revokePreview(prev);
        return null;
      });
      setSizeChartFile(null);
      return;
    }
    toast.info("Upload a new image to replace it — removal isn't supported.");
  };

  const uploadCategoryMedia = async (
    type: "category" | "category-size-chart",
    file: File,
  ): Promise<{ ok: boolean; status: number }> => {
    const formData = new FormData();
    formData.append("type", type);
    formData.append("categorySlug", category.slug);
    formData.append("files", file);

    const res = await fetch("/api/media/admin/upload", {
      method: "POST",
      body: formData,
    });
    return { ok: res.ok, status: res.status };
  };

  const handleUnauthorized = () => {
    toast.error("You are not authorized to edit categories.");
    router.push("/admin/categories");
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSaving || !isDirty) return;

    setErrors({});

    const patchBody: {
      title?: string;
      description?: string;
      isActive?: boolean;
    } = {};
    if (titleChanged) patchBody.title = title.trim();
    if (descriptionChanged && description.trim())
      patchBody.description = description.trim();
    if (isActiveChanged) patchBody.isActive = isActive;

    const hasTextChanges = Object.keys(patchBody).length > 0;

    if (hasTextChanges) {
      const parsed = await updateCategorySchema.safeParseAsync(patchBody);
      if (!parsed.success) {
        const fieldErrors = parsed.error.flatten(
          (issue) => issue.message,
        ).fieldErrors;
        setErrors({
          title: fieldErrors.title?.[0],
          description: fieldErrors.description?.[0],
        });
        toast.error("Please fix the highlighted fields.");
        return;
      }
    }

    setIsSaving(true);
    const toastId = toast.loading("Saving changes…");

    try {
      if (imageFile) {
        const { ok, status } = await uploadCategoryMedia("category", imageFile);
        if (!ok) {
          if (status === 401 || status === 403) {
            toast.dismiss(toastId);
            handleUnauthorized();
            return;
          }
          toast.error("Couldn't upload the category image.", {
            id: toastId,
            action: { label: "Retry", onClick: () => handleSubmit(e) },
          });
          return;
        }
      }

      if (sizeChartFile) {
        const { ok, status } = await uploadCategoryMedia(
          "category-size-chart",
          sizeChartFile,
        );
        if (!ok) {
          if (status === 401 || status === 403) {
            toast.dismiss(toastId);
            handleUnauthorized();
            return;
          }
          toast.error("Couldn't upload the size chart image.", {
            id: toastId,
            action: { label: "Retry", onClick: () => handleSubmit(e) },
          });
          return;
        }
      }

      if (hasTextChanges) {
        const res = await fetch(`/api/categories/${category.slug}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patchBody),
        });
        const payload = (await res
          .json()
          .catch(() => null)) as ApiEnvelope | null;

        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            toast.dismiss(toastId);
            handleUnauthorized();
            return;
          }
          if (res.status === 409) {
            setErrors((prev) => ({
              ...prev,
              title: payload?.message ?? "A category with this name exists.",
            }));
            toast.error("That name is already taken.", { id: toastId });
            return;
          }
          if (res.status === 400 && payload?.errors) {
            setErrors({
              title: payload.errors.title?.[0],
              description: payload.errors.description?.[0],
            });
            toast.error(payload.message ?? "Please fix the fields.", {
              id: toastId,
            });
            return;
          }
          toast.error(payload?.message ?? "Couldn't save changes.", {
            id: toastId,
            action: { label: "Retry", onClick: () => handleSubmit(e) },
          });
          return;
        }
      }

      toast.success("Category updated.", { id: toastId });

      const nextSlug = titleChanged ? derivedSlug : category.slug;
      if (nextSlug !== category.slug) {
        router.replace(`/admin/categories/${nextSlug}`);
      }
      router.refresh();
    } catch {
      toast.error("Something went wrong. Your changes are still here.", {
        id: toastId,
        action: { label: "Retry", onClick: () => handleSubmit(e) },
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (confirmLeave()) {
      router.push("/admin/categories");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-paper">
      <header className="sticky top-0 z-40 flex flex-col gap-1 border-b border-ink-25 bg-paper px-6 py-3">
        <h1 className="font-display text-3xl font-bold leading-tight text-ink">
          {category.title}
        </h1>
        <p className="font-body text-xs tracking-wide text-ink-40">
          Edit category
        </p>
      </header>

      <form
        id="category-edit-form"
        onSubmit={handleSubmit}
        className={`flex-1 px-6 py-6 pb-28 transition-opacity ${
          isSaving ? "pointer-events-none opacity-60" : ""
        }`}
      >
        <div className="mx-auto max-w-5xl">
          <button
            type="button"
            onClick={handleCancel}
            className="mb-4 flex w-fit items-center gap-1 text-rose-gold"
          >
            <ChevronLeft size={18} className="stroke-[1.7]" />
            <span className="text-sm font-bold">Back to categories</span>
          </button>

          <fieldset
            disabled={isSaving}
            className="grid grid-cols-1 gap-6 md:grid-cols-3"
          >
            <section className="flex flex-col gap-6 rounded-xl border border-ink-40 bg-paper p-6 shadow-sm md:col-span-2">
              <h2 className="font-display text-2xl font-bold text-ink">
                Category details
              </h2>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="title"
                  className="font-body text-xs font-bold uppercase tracking-wider text-ink-55"
                >
                  Title
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setErrors((prev) => ({ ...prev, title: undefined }));
                  }}
                  placeholder="e.g. Bridal Lehengas"
                  aria-invalid={!!errors.title}
                  className={`w-full rounded-lg border bg-paper px-4 py-2.5 font-body text-ink transition-colors placeholder:text-ink-40 focus:outline-none ${
                    errors.title
                      ? "border-rust focus:border-rust"
                      : "border-ink-40 focus:border-ink"
                  }`}
                />
                {errors.title && (
                  <p className="font-body text-xs text-rust">{errors.title}</p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="slug"
                  className="font-body text-xs font-bold uppercase tracking-wider text-ink-55"
                >
                  Slug
                </label>
                <div className="flex w-full items-center overflow-hidden rounded-lg border border-ink-40 bg-paper">
                  <span className="border-r border-ink-40 bg-ink-08 px-4 py-2.5 font-body text-ink-55">
                    /category/
                  </span>
                  <input
                    id="slug"
                    type="text"
                    value={derivedSlug}
                    readOnly
                    className="w-full cursor-not-allowed bg-transparent px-4 py-2.5 font-body text-ink focus:outline-none"
                  />
                </div>
                <p className="font-body text-xs text-ink-40">
                  Auto-generated from the title.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="description"
                  className="font-body text-xs font-bold uppercase tracking-wider text-ink-55"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    setErrors((prev) => ({ ...prev, description: undefined }));
                  }}
                  rows={6}
                  placeholder="Describe this collection…"
                  aria-invalid={!!errors.description}
                  className={`w-full resize-none rounded-lg border bg-paper px-4 py-2.5 font-body text-ink transition-colors placeholder:text-ink-40 focus:outline-none ${
                    errors.description
                      ? "border-rust focus:border-rust"
                      : "border-ink-40 focus:border-ink"
                  }`}
                />
                {errors.description && (
                  <p className="font-body text-xs text-rust">
                    {errors.description}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between gap-4 rounded-lg border border-ink-25 px-4 py-3">
                <div className="flex flex-col">
                  <span className="font-body text-sm font-bold text-ink">
                    Active
                  </span>
                  <span className="font-body text-xs text-ink-40">
                    Visible to customers on the store.
                  </span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isActive}
                  onClick={() => setIsActive((v) => !v)}
                  className={`relative h-6 w-11 shrink-0 rounded-pill transition-colors ${
                    isActive ? "bg-rose-gold" : "bg-ink-25"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-pill bg-paper transition-all ${
                      isActive ? "left-5.5" : "left-0.5"
                    }`}
                  />
                </button>
              </div>
            </section>

            <section className="flex h-fit flex-col gap-8 rounded-xl border border-ink-40 bg-paper p-6 shadow-sm md:col-span-1">
              <div className="flex flex-col gap-4">
                <h2 className="font-display text-2xl font-bold text-ink">
                  Category image
                </h2>
                <FileUpload
                  imagePreview={imagePreview ?? category.categoryImageUrl}
                  onFileSelect={handleImageSelect}
                  onFileRemove={handleImageRemove}
                  accept="image"
                  maxFiles={1}
                  title="Upload image"
                  subtitle="1200 × 1600 recommended"
                />
              </div>

              <div className="flex flex-col gap-4">
                <h2 className="font-display text-2xl font-bold text-ink">
                  Size chart
                </h2>
                <FileUpload
                  imagePreview={sizeChartPreview ?? category.sizeChartImageUrl}
                  onFileSelect={handleSizeChartSelect}
                  onFileRemove={handleSizeChartRemove}
                  accept="image"
                  maxFiles={1}
                  title="Upload size chart"
                  subtitle="Optional reference image"
                />
              </div>
            </section>
          </fieldset>
        </div>
      </form>

      <div className="sticky bottom-0 z-40 flex items-center justify-end gap-3 border-t border-ink-25 bg-paper px-6 py-3">
        <button
          type="button"
          onClick={handleCancel}
          disabled={isSaving}
          className="rounded-lg border border-ink-40 bg-paper px-5 py-2.5 font-body text-sm font-bold text-ink transition-colors hover:border-ink hover:bg-ink hover:text-paper disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          form="category-edit-form"
          disabled={!isDirty || isSaving}
          className="flex items-center gap-2 rounded-lg bg-rose-gold px-5 py-2.5 font-body text-sm font-bold text-paper transition-colors hover:bg-rose-gold-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving && <Loader2 size={16} className="animate-spin" />}
          {isSaving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  );
}
