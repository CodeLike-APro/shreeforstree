"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import FileUpload from "@/utils/FileUpload";

interface ApiResponse {
  success: boolean;
  message: string;
  data: unknown;
  errors?: Record<string, string[]>;
}

export default function PostCategory() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isDirty =
    name.trim() !== "" || description.trim() !== "" || imageFile !== null;

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

  const handleLeave = () => {
    if (confirmLeave()) {
      router.push("/admin/categories");
    }
  };

  const handleFileSelect = (file: File) => {
    setImagePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setImageFile(file);
  };

  const handleFileRemove = () => {
    setImagePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setImageFile(null);
  };

  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!name.trim()) {
      toast.error("Category title is required");
      return;
    }

    const formData = new FormData();
    formData.append("title", name.trim());
    if (description.trim()) formData.append("description", description.trim());
    formData.append("isActive", "true");
    if (imageFile) formData.append("files", imageFile);

    setIsSubmitting(true);
    const toastId = toast.loading("Creating category…");

    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        body: formData,
      });
      const payload = (await res
        .json()
        .catch(() => null)) as ApiResponse | null;

      if (!res.ok) {
        const firstFieldError = payload?.errors
          ? Object.values(payload.errors).flat()[0]
          : undefined;
        toast.error(payload?.message ?? "Failed to create category", {
          id: toastId,
          description: firstFieldError,
        });
        return;
      }

      toast.success(payload?.message ?? "Category created successfully", {
        id: toastId,
      });

      handleFileRemove();
      setName("");
      setDescription("");

      router.push("/admin/categories");
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-paper">
      <header className="sticky top-0 z-40 flex flex-col gap-1 border-b border-ink-25 bg-paper px-6 py-3">
        <h1 className="font-display text-3xl font-bold leading-tight text-ink">
          New category
        </h1>
        <p className="font-body text-xs tracking-wide text-ink-40">
          Add a collection to your store
        </p>
      </header>

      <form
        id="category-post-form"
        onSubmit={handleSubmit}
        className={`flex-1 px-6 py-6 pb-28 transition-opacity ${
          isSubmitting ? "pointer-events-none opacity-60" : ""
        }`}
      >
        <div className="mx-auto max-w-5xl">
          <button
            type="button"
            onClick={handleLeave}
            className="mb-4 flex w-fit items-center gap-1 text-rose-gold"
          >
            <ChevronLeft size={18} className="stroke-[1.7]" />
            <span className="text-sm font-bold">Back to categories</span>
          </button>

          <fieldset
            disabled={isSubmitting}
            className="grid grid-cols-1 gap-6 md:grid-cols-3"
          >
            <section className="flex flex-col gap-6 rounded-xl border border-ink-40 bg-paper p-6 shadow-sm md:col-span-2">
              <h2 className="font-display text-2xl font-bold text-ink">
                Category details
              </h2>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="name"
                  className="font-body text-xs font-bold uppercase tracking-wider text-ink-55"
                >
                  Title
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Bridal Lehengas"
                  className="w-full rounded-lg border border-ink-40 bg-paper px-4 py-2.5 font-body text-ink transition-colors placeholder:text-ink-40 focus:border-ink focus:outline-none"
                />
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
                    type="text"
                    id="slug"
                    value={slug}
                    readOnly
                    placeholder="bridal-lehengas"
                    className="w-full cursor-not-allowed bg-transparent px-4 py-2.5 font-body text-ink placeholder:text-ink-40 focus:outline-none"
                  />
                </div>
                <p className="font-body text-xs text-ink-40">
                  Used in the URL. Auto-filled from the title.
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
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe this collection…"
                  rows={6}
                  className="w-full resize-none rounded-lg border border-ink-40 bg-paper px-4 py-2.5 font-body text-ink transition-colors placeholder:text-ink-40 focus:border-ink focus:outline-none"
                />
              </div>
            </section>

            <section className="flex h-fit flex-col gap-4 rounded-xl border border-ink-40 bg-paper p-6 shadow-sm md:col-span-1">
              <h2 className="font-display text-2xl font-bold text-ink">
                Category image
              </h2>

              <FileUpload
                imagePreview={imagePreview}
                onFileSelect={handleFileSelect}
                onFileRemove={handleFileRemove}
                accept="image"
                maxFiles={1}
                title="Upload image"
                subtitle="1200 × 1600 recommended"
              />
            </section>
          </fieldset>
        </div>
      </form>

      <div className="sticky bottom-0 z-40 flex items-center justify-end gap-3 border-t border-ink-25 bg-paper px-6 py-3">
        <button
          type="button"
          onClick={handleLeave}
          disabled={isSubmitting}
          className="flex-1 sm:flex-initial flex items-center justify-center rounded-lg border border-ink-40 bg-paper px-5 py-3.5 sm:py-2.5 font-body text-sm font-bold text-ink transition-colors hover:border-ink hover:bg-ink hover:text-paper disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          form="category-post-form"
          disabled={isSubmitting}
          className="flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-lg bg-rose-gold px-5 py-3.5 sm:py-2.5 font-body text-sm font-bold text-paper transition-colors hover:bg-rose-gold-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting && <Loader2 size={16} className="animate-spin" />}
          {isSubmitting ? "Creating…" : "Create category"}
        </button>
      </div>
    </div>
  );
}
