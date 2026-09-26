"use client";

import { ChevronLeft, Loader2, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  type KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import slugify from "slugify";
import { toast } from "sonner";
import { PRODUCT_SIZES } from "@/lib/constants";
import {
  createProductSchema,
  updateProductSchema,
} from "@/lib/validators/product.validators";
import {
  type GalleryItem,
  HeroImageSlot,
  ProductGalleryManager,
} from "./ProductMediaManager";

import type { ApiResult } from "@/types/api";
import type { HeroUploadData, UploadedMedia } from "@/types/api/media";
import type { ProductDetail, ProductFieldErrors } from "@/types/api/products";
import type { Category, Product } from "@/types/models";

export interface ProductMediaInitial {
  url: string;
  path: string;
  type: "image" | "video";
  sortOrder: number;
}

export interface ProductFormInitial {
  id: string;
  title: string;
  description: string;
  price: string;
  discountedPrice: string | null;
  sizes: string[];
  colors: string[];
  isActive: boolean;
  isNewArrival: boolean;
  isHeroProduct: boolean;
  fabric: string;
  work: string[];
  silhouette: string | null;
  lining: string | null;
  sleeveType: string | null;
  neckline: string | null;
  length: string | null;
  careInstructions: string | null;
  keywords: string[];
  categoryIds: string[];
  gallery: ProductMediaInitial[];
  heroUrl: string | null;
}

interface ProductFormProps {
  mode: "create" | "edit";
  initial?: ProductFormInitial;
  hasOrders?: boolean;
}

interface CategoryOption {
  id: string;
  title: string;
  isActive: boolean;
}

type Errors = Record<string, string | undefined>;

const MAX_GALLERY = 10;

const inputCls =
  "w-full rounded-lg border bg-paper px-4 py-2.5 font-body text-ink transition-colors placeholder:text-ink-40 focus:outline-none";
const labelCls =
  "font-body text-xs font-bold uppercase tracking-wider text-ink-55";
const sectionCls =
  "flex flex-col gap-5 rounded-xl border border-ink-40 bg-paper p-6 shadow-sm";
const headingCls = "font-display text-2xl font-bold text-ink";

const setEq = (a: string[], b: string[]) =>
  a.length === b.length &&
  [...a].sort().join("\u001f") === [...b].sort().join("\u001f");

const galSig = (items: GalleryItem[]) =>
  items.map((it) => (it.existing ? `e:${it.path}` : `n:${it.key}`)).join("|");

function Field({
  label,
  htmlFor,
  error,
  children,
  hint,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={htmlFor} className={labelCls}>
        {label}
      </label>
      {children}
      {hint && !error && (
        <p className="font-body text-ink-40 text-xs">{hint}</p>
      )}
      {error && <p className="font-body text-rust text-xs">{error}</p>}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`rounded-pill relative h-6 w-11 shrink-0 transition-colors ${
        checked ? "bg-rose-gold" : "bg-ink-25"
      }`}
    >
      <span
        className={`rounded-pill bg-paper absolute top-0.5 h-5 w-5 transition-all ${
          checked ? "left-5.5" : "left-0.5"
        }`}
      />
    </button>
  );
}

function ChipInput({
  label,
  values,
  onChange,
  placeholder,
  disabled,
  error,
}: {
  label: string;
  values: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
}) {
  const [draft, setDraft] = useState("");

  const add = () => {
    const v = draft.trim();
    if (!v) return;
    if (values.some((x) => x.toLowerCase() === v.toLowerCase())) {
      setDraft("");
      return;
    }
    onChange([...values, v]);
    setDraft("");
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add();
    } else if (e.key === "Backspace" && !draft && values.length) {
      onChange(values.slice(0, -1));
    }
  };

  return (
    <Field label={label} error={error}>
      <div
        className={`bg-paper flex flex-wrap gap-2 rounded-lg border px-3 py-2 ${
          error ? "border-rust" : "border-ink-40"
        }`}
      >
        {values.map((val) => (
          <span
            key={val}
            className="rounded-pill bg-ink-08 font-body text-ink flex items-center gap-1 px-2.5 py-1 text-sm"
          >
            {val}
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange(values.filter((v) => v !== val))}
              aria-label={`Remove ${val}`}
              className="text-ink-40 hover:text-rust"
            >
              <X size={14} />
            </button>
          </span>
        ))}
        <input
          value={draft}
          disabled={disabled}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKey}
          onBlur={add}
          placeholder={values.length ? "" : placeholder}
          className="font-body text-ink placeholder:text-ink-40 min-w-24 flex-1 bg-transparent py-1 focus:outline-none"
        />
      </div>
    </Field>
  );
}

export default function ProductForm({
  mode,
  initial,
  hasOrders,
}: ProductFormProps) {
  const router = useRouter();
  const isEdit = mode === "edit";

  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [price, setPrice] = useState(initial?.price ?? "");
  const [discountedPrice, setDiscountedPrice] = useState(
    initial?.discountedPrice ?? "",
  );
  const [fabric, setFabric] = useState(initial?.fabric ?? "");
  const [silhouette, setSilhouette] = useState(initial?.silhouette ?? "");
  const [lining, setLining] = useState(initial?.lining ?? "");
  const [sleeveType, setSleeveType] = useState(initial?.sleeveType ?? "");
  const [neckline, setNeckline] = useState(initial?.neckline ?? "");
  const [length, setLength] = useState(initial?.length ?? "");
  const [careInstructions, setCareInstructions] = useState(
    initial?.careInstructions ?? "",
  );

  const [sizes, setSizes] = useState<string[]>(initial?.sizes ?? []);
  const [colors, setColors] = useState<string[]>(initial?.colors ?? []);
  const [work, setWork] = useState<string[]>(initial?.work ?? []);
  const [keywords, setKeywords] = useState<string[]>(initial?.keywords ?? []);
  const [categoryIds, setCategoryIds] = useState<string[]>(
    initial?.categoryIds ?? [],
  );

  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [isNewArrival, setIsNewArrival] = useState(
    initial?.isNewArrival ?? false,
  );
  const [isHeroProduct, setIsHeroProduct] = useState(
    initial?.isHeroProduct ?? false,
  );

  const [items, setItems] = useState<GalleryItem[]>(() =>
    (initial?.gallery ?? [])
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((m) => ({
        key: m.path,
        type: m.type,
        previewUrl: m.url,
        existing: true,
        url: m.url,
        path: m.path,
      })),
  );
  const [removed, setRemoved] = useState<GalleryItem[]>([]);
  const [heroExistingUrl, setHeroExistingUrl] = useState<string | null>(
    initial?.heroUrl ?? null,
  );
  const [heroFile, setHeroFile] = useState<File | null>(null);
  const [heroPreview, setHeroPreview] = useState<string | null>(null);

  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [errors, setErrors] = useState<Errors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [baselineGalSig, setBaselineGalSig] = useState(() => galSig(items));

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");

  const objectUrls = useRef<Set<string>>(new Set());
  const makeUrl = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    objectUrls.current.add(url);
    return url;
  }, []);
  const revokeUrl = useCallback((url: string | null) => {
    if (url && objectUrls.current.has(url)) {
      URL.revokeObjectURL(url);
      objectUrls.current.delete(url);
    }
  }, []);
  useEffect(() => {
    const urls = objectUrls.current;
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
      urls.clear();
    };
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/categories");
        const payload = (await res.json().catch(() => null)) as ApiResult<
          Category[]
        > | null;
        if (active && res.ok && payload?.data) setCategories(payload.data);
      } catch {
        // non-blocking; the picker just stays empty
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const b = initial;
  const scalarsDirty = isEdit
    ? title.trim() !== (b?.title ?? "") ||
      description.trim() !== (b?.description ?? "") ||
      price.trim() !== (b?.price ?? "") ||
      (discountedPrice.trim() !== "" &&
        discountedPrice.trim() !== (b?.discountedPrice ?? "")) ||
      fabric.trim() !== (b?.fabric ?? "") ||
      silhouette.trim() !== (b?.silhouette ?? "") ||
      lining.trim() !== (b?.lining ?? "") ||
      sleeveType.trim() !== (b?.sleeveType ?? "") ||
      neckline.trim() !== (b?.neckline ?? "") ||
      length.trim() !== (b?.length ?? "") ||
      careInstructions.trim() !== (b?.careInstructions ?? "") ||
      !setEq(sizes, b?.sizes ?? []) ||
      !setEq(colors, b?.colors ?? []) ||
      !setEq(work, b?.work ?? []) ||
      !setEq(keywords, b?.keywords ?? []) ||
      !setEq(categoryIds, b?.categoryIds ?? []) ||
      isActive !== (b?.isActive ?? true) ||
      isNewArrival !== (b?.isNewArrival ?? false) ||
      isHeroProduct !== (b?.isHeroProduct ?? false)
    : title.trim() !== "" ||
      description.trim() !== "" ||
      price.trim() !== "" ||
      fabric.trim() !== "" ||
      sizes.length > 0 ||
      colors.length > 0 ||
      categoryIds.length > 0;

  const galleryDirty = galSig(items) !== baselineGalSig || removed.length > 0;
  const heroDirty = heroFile !== null;
  const mediaDirty = galleryDirty || heroDirty || items.length > 0;
  const isDirty = isEdit
    ? scalarsDirty || galleryDirty || heroDirty
    : scalarsDirty || mediaDirty;

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
    if (confirmLeave()) router.push("/admin/products");
  };

  const derivedSlug = title.trim()
    ? slugify(title.trim(), { lower: true, strict: true })
    : "";

  const clearError = (key: string) =>
    setErrors((prev) => ({ ...prev, [key]: undefined }));

  // ---- media handlers ----
  const addGalleryFiles = (files: File[]) => {
    const room = MAX_GALLERY - items.length;
    const accepted = files
      .filter((f) => f.type.startsWith("image/") || f.type.startsWith("video/"))
      .slice(0, Math.max(0, room));
    if (accepted.length < files.length) {
      toast.info(`Only images and videos are allowed (max ${MAX_GALLERY}).`);
    }
    const next: GalleryItem[] = accepted.map((file) => ({
      key: `new-${crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`}`,
      type: file.type.startsWith("video/") ? "video" : "image",
      previewUrl: makeUrl(file),
      existing: false,
      file,
    }));
    if (next.length) {
      setItems((prev) => [...prev, ...next]);
      clearError("media");
    }
  };

  const removeGalleryItem = (key: string) => {
    setItems((prev) => {
      const found = prev.find((it) => it.key === key);
      if (found && !found.existing) revokeUrl(found.previewUrl);
      if (found && found.existing) setRemoved((r) => [...r, found]);
      return prev.filter((it) => it.key !== key);
    });
  };

  const restoreGalleryItem = (key: string) => {
    setRemoved((prev) => {
      const found = prev.find((it) => it.key === key);
      if (found) setItems((its) => [...its, found]);
      return prev.filter((it) => it.key !== key);
    });
  };

  const reorderGallery = (from: number, to: number) => {
    setItems((prev) => {
      if (to < 0 || to >= prev.length) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };

  const selectHero = (file: File) => {
    setHeroPreview((prev) => {
      revokeUrl(prev);
      return makeUrl(file);
    });
    setHeroFile(file);
  };
  const clearHero = () => {
    setHeroPreview((prev) => {
      revokeUrl(prev);
      return null;
    });
    setHeroFile(null);
  };

  // ---- save ----
  const optional = (s: string) => {
    const t = s.trim();
    return t ? t : undefined;
  };
  const nullable = (s: string) => {
    const t = s.trim();
    return t ? t : null;
  };

  const handleUnauthorized = (toastId?: string | number) => {
    if (toastId !== undefined) toast.dismiss(toastId);
    toast.error("You are not authorized to manage products.");
    router.push("/admin/products");
  };

  const mapFieldErrors = (payloadErrors?: ProductFieldErrors | undefined) => {
    if (!payloadErrors) return;
    const mapped: Errors = {};
    for (const [key, msgs] of Object.entries(payloadErrors)) {
      mapped[key] = msgs?.[0];
    }
    setErrors(mapped);
  };

  const uploadGallery = async (files: File[], keepCount: number) => {
    const fd = new FormData();
    fd.append("type", "product-gallery");
    fd.append("productId", initial!.id);
    fd.append("keepCount", String(keepCount));
    for (const file of files) fd.append("files", file);
    const res = await fetch("/api/media/admin/upload", {
      method: "POST",
      body: fd,
    });
    const payload = (await res.json().catch(() => null)) as ApiResult<
      UploadedMedia[]
    > | null;
    return { res, payload };
  };

  const handleCreate = async () => {
    const body = {
      title: title.trim(),
      description: description.trim(),
      price: price.trim(),
      discountedPrice: optional(discountedPrice),
      sizes,
      colors,
      isActive,
      isNewArrival,
      isHeroProduct,
      fabric: fabric.trim(),
      work: work.length ? work : undefined,
      silhouette: optional(silhouette),
      lining: optional(lining),
      sleeveType: optional(sleeveType),
      neckline: optional(neckline),
      length: optional(length),
      careInstructions: optional(careInstructions),
      keywords: keywords.length ? keywords : undefined,
      categoryIds,
    };

    const parsed = await createProductSchema.safeParseAsync(body);
    if (!parsed.success) {
      mapFieldErrors(parsed.error.flatten((i) => i.message).fieldErrors);
      toast.error("Please fix the highlighted fields.");
      return;
    }
    if (items.length === 0) {
      setErrors((p) => ({ ...p, media: "Add at least one image." }));
      toast.error("At least one media file is required.");
      return;
    }
    if (!items.some((it) => it.type === "image")) {
      setErrors((p) => ({ ...p, media: "At least one image is required." }));
      toast.error("At least one image is required.");
      return;
    }

    setErrors({});
    setIsSaving(true);
    const toastId = toast.loading("Creating product…");
    try {
      const fd = new FormData();
      fd.append("title", body.title);
      fd.append("description", body.description);
      fd.append("price", body.price);
      if (body.discountedPrice)
        fd.append("discountedPrice", body.discountedPrice);
      fd.append("fabric", body.fabric);
      sizes.forEach((s) => fd.append("sizes", s));
      colors.forEach((c) => fd.append("colors", c));
      work.forEach((w) => fd.append("work", w));
      keywords.forEach((k) => fd.append("keywords", k));
      categoryIds.forEach((id) => fd.append("categoryIds", id));
      if (body.silhouette) fd.append("silhouette", body.silhouette);
      if (body.lining) fd.append("lining", body.lining);
      if (body.sleeveType) fd.append("sleeveType", body.sleeveType);
      if (body.neckline) fd.append("neckline", body.neckline);
      if (body.length) fd.append("length", body.length);
      if (body.careInstructions)
        fd.append("careInstructions", body.careInstructions);
      fd.append("isActive", String(isActive));
      fd.append("isNewArrival", String(isNewArrival));
      fd.append("isHeroProduct", String(isHeroProduct));

      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        if (!it.file) continue;
        fd.append("files", it.file);
        fd.append("sortOrders", String(i));
      }

      const res = await fetch("/api/products", { method: "POST", body: fd });
      const payload = (await res
        .json()
        .catch(() => null)) as ApiResult<Product> | null;

      if (!payload?.success) {
        if (res.status === 401 || res.status === 403)
          return handleUnauthorized(toastId);
        if (res.status === 409) {
          setErrors((p) => ({
            ...p,
            title: payload?.message ?? "A product with this title exists.",
          }));
          toast.error("That title is already taken.", { id: toastId });
          return;
        }
        if (res.status === 400 && payload?.errors) {
          mapFieldErrors(payload.errors as ProductFieldErrors);
          toast.error(payload.message ?? "Please fix the fields.", {
            id: toastId,
          });
          return;
        }
        toast.error(payload?.message ?? "Couldn't create the product.", {
          id: toastId,
          action: { label: "Retry", onClick: () => handleCreate() },
        });
        return;
      }

      toast.success("Product created.", { id: toastId });
      const newId = payload?.data?.id;
      if (newId) router.push(`/admin/products/${newId}`);
      else router.push("/admin/products");
    } catch {
      toast.error("Something went wrong. Your changes are still here.", {
        id: toastId,
        action: { label: "Retry", onClick: () => handleCreate() },
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!initial) return;
    const patch: Record<string, unknown> = {};
    if (title.trim() !== initial.title) patch.title = title.trim();
    if (description.trim() !== initial.description)
      patch.description = description.trim();
    if (price.trim() !== initial.price) patch.price = price.trim();
    if (
      discountedPrice.trim() &&
      discountedPrice.trim() !== (initial.discountedPrice ?? "")
    )
      patch.discountedPrice = discountedPrice.trim();
    if (fabric.trim() !== initial.fabric) patch.fabric = fabric.trim();

    const nullableChanged = (cur: string, init: string | null, key: string) => {
      const v = nullable(cur);
      if (v !== (init ?? null)) patch[key] = v;
    };
    nullableChanged(silhouette, initial.silhouette, "silhouette");
    nullableChanged(lining, initial.lining, "lining");
    nullableChanged(sleeveType, initial.sleeveType, "sleeveType");
    nullableChanged(neckline, initial.neckline, "neckline");
    nullableChanged(length, initial.length, "length");
    nullableChanged(
      careInstructions,
      initial.careInstructions,
      "careInstructions",
    );

    if (!setEq(sizes, initial.sizes)) patch.sizes = sizes;
    if (!setEq(colors, initial.colors)) patch.colors = colors;
    if (!setEq(work, initial.work)) patch.work = work;
    if (!setEq(keywords, initial.keywords)) patch.keywords = keywords;
    if (!setEq(categoryIds, initial.categoryIds))
      patch.categoryIds = categoryIds;
    if (isActive !== initial.isActive) patch.isActive = isActive;
    if (isNewArrival !== initial.isNewArrival)
      patch.isNewArrival = isNewArrival;
    if (isHeroProduct !== initial.isHeroProduct)
      patch.isHeroProduct = isHeroProduct;

    if (sizes.length === 0) {
      setErrors((p) => ({ ...p, sizes: "At least one size is required." }));
      toast.error("At least one size is required.");
      return;
    }
    if (colors.length === 0) {
      setErrors((p) => ({ ...p, colors: "At least one color is required." }));
      toast.error("At least one color is required.");
      return;
    }
    if (categoryIds.length === 0) {
      setErrors((p) => ({
        ...p,
        categoryIds: "Select at least one category.",
      }));
      toast.error("Select at least one category.");
      return;
    }
    if (galleryDirty && items.length === 0) {
      setErrors((p) => ({ ...p, media: "At least one image is required." }));
      toast.error("At least one image is required.");
      return;
    }
    if (galleryDirty && !items.some((it) => it.type === "image")) {
      setErrors((p) => ({ ...p, media: "At least one image is required." }));
      toast.error("At least one image is required.");
      return;
    }

    setErrors({});
    setIsSaving(true);
    const toastId = toast.loading("Saving changes…");
    try {
      let uploadedGallery: UploadedMedia[] = [];
      const uploadedGalleryByKey = new Map<string, UploadedMedia>();
      let mediaArray: UploadedMedia[] | null = null;

      if (galleryDirty) {
        const newItems = items.filter((it) => !it.existing && it.file);
        if (newItems.length) {
          const newFiles = newItems.map((it) => it.file!);
          const keepCount = items.filter((it) => it.existing).length;
          const { res, payload } = await uploadGallery(newFiles, keepCount);
          if (!res.ok) {
            if (res.status === 401 || res.status === 403)
              return handleUnauthorized(toastId);
            toast.error(payload?.message ?? "Couldn't upload media.", {
              id: toastId,
              action: { label: "Retry", onClick: () => handleEdit() },
            });
            return;
          }
          uploadedGallery = payload?.data ?? [];
          if (
            uploadedGallery.length !== newItems.length ||
            uploadedGallery.some((media) => !media?.url || !media.path)
          ) {
            toast.error("The uploaded media response was incomplete.", {
              id: toastId,
            });
            return;
          }
          newItems.forEach((item, index) => {
            uploadedGalleryByKey.set(item.key, uploadedGallery[index]);
          });
        }
        mediaArray = items.map((it, index) => {
          if (it.existing)
            return {
              url: it.url!,
              path: it.path!,
              type: it.type,
              sortOrder: index,
            };
          const up = uploadedGalleryByKey.get(it.key);
          if (!up) throw new Error("Missing uploaded gallery media");
          return {
            url: up.url,
            path: up.path,
            type: it.type,
            sortOrder: index,
          };
        });
        patch.media = mediaArray;
      }

      let heroResult: HeroUploadData | null = null;
      if (heroFile) {
        const fd = new FormData();
        fd.append("type", "product-hero");
        fd.append("productId", initial.id);
        fd.append("files", heroFile);
        const res = await fetch("/api/media/admin/upload", {
          method: "POST",
          body: fd,
        });
        const payload = (await res
          .json()
          .catch(() => null)) as ApiResult<HeroUploadData> | null;
        if (!res.ok) {
          if (res.status === 401 || res.status === 403)
            return handleUnauthorized(toastId);
          toast.error(payload?.message ?? "Couldn't upload the hero image.", {
            id: toastId,
            action: { label: "Retry", onClick: () => handleEdit() },
          });
          return;
        }
        heroResult = payload?.data ?? null;
      }

      if (Object.keys(patch).length > 0) {
        const parsed = await updateProductSchema.safeParseAsync(patch);
        if (!parsed.success) {
          mapFieldErrors(parsed.error.flatten((i) => i.message).fieldErrors);
          toast.error("Please fix the highlighted fields.", { id: toastId });
          return;
        }
        const res = await fetch(`/api/products/${initial.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        const payload = (await res
          .json()
          .catch(() => null)) as ApiResult<ProductDetail> | null;
        if (!payload?.success) {
          if (res.status === 401 || res.status === 403)
            return handleUnauthorized(toastId);
          if (res.status === 409) {
            setErrors((p) => ({
              ...p,
              title: payload?.message ?? "A product with this title exists.",
            }));
            toast.error("That title is already taken.", { id: toastId });
            return;
          }
          if (res.status === 400 && payload?.errors) {
            mapFieldErrors(payload.errors as ProductFieldErrors);
            toast.error(payload.message ?? "Please fix the fields.", {
              id: toastId,
            });
            return;
          }
          toast.error(payload?.message ?? "Couldn't save changes.", {
            id: toastId,
            action: { label: "Retry", onClick: () => handleEdit() },
          });
          return;
        }
      }

      // reconcile local state so the form is clean without a reload
      if (mediaArray) {
        setItems((prev) =>
          prev.map((it) => {
            if (it.existing) return it;
            const up = uploadedGalleryByKey.get(it.key);
            if (!up) return it;
            revokeUrl(it.previewUrl);
            return {
              key: up.path,
              type: it.type,
              previewUrl: up.url,
              existing: true,
              url: up.url,
              path: up.path,
            };
          }),
        );
        setRemoved([]);
        setBaselineGalSig(mediaArray.map((m) => `e:${m.path}`).join("|"));
      }
      if (heroResult) {
        revokeUrl(heroPreview);
        setHeroPreview(null);
        setHeroFile(null);
        setHeroExistingUrl(heroResult.url);
      }

      // fold the just-saved values into `initial` so dirty resets
      Object.assign(initial, {
        title: title.trim(),
        description: description.trim(),
        price: price.trim(),
        discountedPrice: discountedPrice.trim() || initial.discountedPrice,
        fabric: fabric.trim(),
        silhouette: nullable(silhouette),
        lining: nullable(lining),
        sleeveType: nullable(sleeveType),
        neckline: nullable(neckline),
        length: nullable(length),
        careInstructions: nullable(careInstructions),
        sizes: [...sizes],
        colors: [...colors],
        work: [...work],
        keywords: [...keywords],
        categoryIds: [...categoryIds],
        isActive,
        isNewArrival,
        isHeroProduct,
      });

      toast.success("Product updated.", { id: toastId });
      router.refresh();
    } catch {
      toast.error("Something went wrong. Your changes are still here.", {
        id: toastId,
        action: { label: "Retry", onClick: () => handleEdit() },
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = () => {
    if (isSaving || !isDirty) return;
    if (isEdit) void handleEdit();
    else void handleCreate();
  };

  const deleteThumb =
    items[0]?.previewUrl ?? heroExistingUrl ?? "/images/white.webp";
  const canDelete = isEdit && !hasOrders;
  const deleteReady =
    deleteInput.trim().toLowerCase() ===
    (initial?.title ?? "").trim().toLowerCase();

  const handleDelete = async () => {
    if (!initial || !deleteReady) return;
    setIsSaving(true);
    const toastId = toast.loading("Deleting product…");
    try {
      const res = await fetch(`/api/products/${initial.id}`, {
        method: "DELETE",
      });
      const payload = (await res
        .json()
        .catch(() => null)) as ApiResult<null> | null;
      if (!res.ok) {
        if (res.status === 401 || res.status === 403)
          return handleUnauthorized(toastId);
        if (res.status === 400 || res.status === 409) {
          setDeleteOpen(false);
          toast.error(
            payload?.message ??
              "This product has orders — deactivate it instead.",
            { id: toastId },
          );
          return;
        }
        toast.error(payload?.message ?? "Couldn't delete the product.", {
          id: toastId,
        });
        return;
      }
      toast.success("Product deleted.", { id: toastId });
      router.push("/admin/products");
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.title.localeCompare(b.title)),
    [categories],
  );

  const headerTitle = isEdit ? (initial?.title ?? "") : "New Product";
  const headerSubtitle = isEdit
    ? "Edit product"
    : "Add a piece to the catalogue";

  return (
    <div className="bg-paper flex min-h-screen flex-col">
      <header className="border-ink-25 bg-paper sticky top-0 z-40 flex items-center justify-between gap-3 border-b px-6 py-3">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-ink text-3xl leading-tight font-bold">
            {headerTitle}
          </h1>
          <p className="font-body text-ink-40 text-xs tracking-wide">
            {headerSubtitle}
          </p>
        </div>
        {isDirty && (
          <span className="rounded-pill bg-blush font-body text-rose-gold-dark shrink-0 px-3 py-1 text-xs font-bold">
            Unsaved changes
          </span>
        )}
      </header>

      <form
        id="product-form"
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
        className={`flex-1 px-6 py-6 pb-28 transition-opacity ${
          isSaving ? "pointer-events-none opacity-60" : ""
        }`}
      >
        <div className="mx-auto max-w-5xl">
          <button
            type="button"
            onClick={handleLeave}
            className="text-rose-gold mb-4 flex w-fit items-center gap-1"
          >
            <ChevronLeft size={18} className="stroke-[1.7]" />
            <span className="text-sm font-bold">Back to products</span>
          </button>

          <fieldset
            disabled={isSaving}
            className="grid grid-cols-1 gap-6 md:grid-cols-3"
          >
            {/* Basics */}
            <section className={`${sectionCls} md:col-span-2`}>
              <h2 className={headingCls}>Basics</h2>
              <Field label="Title" htmlFor="title" error={errors.title}>
                <input
                  id="title"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    clearError("title");
                  }}
                  placeholder="e.g. Ivory Silk Anarkali"
                  className={`${inputCls} ${
                    errors.title
                      ? "border-rust focus:border-rust"
                      : "border-ink-40 focus:border-ink"
                  }`}
                />
              </Field>

              <Field label="Slug" hint="Auto-generated from the title.">
                <div className="border-ink-40 bg-paper flex w-full items-center overflow-hidden rounded-lg border">
                  <span className="border-ink-40 bg-ink-08 font-body text-ink-55 border-r px-4 py-2.5">
                    /product/
                  </span>
                  <input
                    value={derivedSlug}
                    readOnly
                    className="font-body text-ink w-full cursor-not-allowed bg-transparent px-4 py-2.5 focus:outline-none"
                  />
                </div>
              </Field>

              <Field
                label="Description"
                htmlFor="description"
                error={errors.description}
              >
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    clearError("description");
                  }}
                  rows={5}
                  placeholder="Describe the piece…"
                  className={`${inputCls} resize-none ${
                    errors.description
                      ? "border-rust focus:border-rust"
                      : "border-ink-40 focus:border-ink"
                  }`}
                />
              </Field>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Price (₹)" htmlFor="price" error={errors.price}>
                  <input
                    id="price"
                    inputMode="decimal"
                    value={price}
                    onChange={(e) => {
                      setPrice(e.target.value);
                      clearError("price");
                    }}
                    placeholder="4999"
                    className={`${inputCls} ${
                      errors.price
                        ? "border-rust focus:border-rust"
                        : "border-ink-40 focus:border-ink"
                    }`}
                  />
                </Field>
                <Field
                  label="Discounted price (₹)"
                  htmlFor="discountedPrice"
                  error={errors.discountedPrice}
                >
                  <input
                    id="discountedPrice"
                    inputMode="decimal"
                    value={discountedPrice}
                    onChange={(e) => {
                      setDiscountedPrice(e.target.value);
                      clearError("discountedPrice");
                    }}
                    placeholder="Optional"
                    className={`${inputCls} ${
                      errors.discountedPrice
                        ? "border-rust focus:border-rust"
                        : "border-ink-40 focus:border-ink"
                    }`}
                  />
                </Field>
              </div>
            </section>

            {/* Flags */}
            <section className={`${sectionCls} md:col-span-1`}>
              <h2 className={headingCls}>Visibility</h2>
              {[
                {
                  label: "Active",
                  hint: "Visible on the store.",
                  value: isActive,
                  set: setIsActive,
                },
                {
                  label: "New arrival",
                  hint: "Show the New badge.",
                  value: isNewArrival,
                  set: setIsNewArrival,
                },
                {
                  label: "Hero product",
                  hint: "Feature on the homepage.",
                  value: isHeroProduct,
                  set: setIsHeroProduct,
                },
              ].map((flag) => (
                <div
                  key={flag.label}
                  className="border-ink-25 flex items-center justify-between gap-4 rounded-lg border px-4 py-3"
                >
                  <div className="flex flex-col">
                    <span className="font-body text-ink text-sm font-bold">
                      {flag.label}
                    </span>
                    <span className="font-body text-ink-40 text-xs">
                      {flag.hint}
                    </span>
                  </div>
                  <Toggle checked={flag.value} onChange={flag.set} />
                </div>
              ))}
            </section>

            {/* Attributes */}
            <section className={`${sectionCls} md:col-span-2`}>
              <h2 className={headingCls}>Attributes</h2>
              <Field label="Fabric" htmlFor="fabric" error={errors.fabric}>
                <input
                  id="fabric"
                  value={fabric}
                  onChange={(e) => {
                    setFabric(e.target.value);
                    clearError("fabric");
                  }}
                  placeholder="e.g. Silk"
                  className={`${inputCls} ${
                    errors.fabric
                      ? "border-rust focus:border-rust"
                      : "border-ink-40 focus:border-ink"
                  }`}
                />
              </Field>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {[
                  {
                    label: "Silhouette",
                    value: silhouette,
                    set: setSilhouette,
                  },
                  {
                    label: "Sleeve type",
                    value: sleeveType,
                    set: setSleeveType,
                  },
                  { label: "Neckline", value: neckline, set: setNeckline },
                  { label: "Lining", value: lining, set: setLining },
                  { label: "Length", value: length, set: setLength },
                ].map((f) => (
                  <Field key={f.label} label={f.label}>
                    <input
                      value={f.value}
                      onChange={(e) => f.set(e.target.value)}
                      placeholder="Optional"
                      className={`${inputCls} border-ink-40 focus:border-ink`}
                    />
                  </Field>
                ))}
              </div>
              <ChipInput
                label="Work"
                values={work}
                onChange={setWork}
                placeholder="Type and press Enter (e.g. Zari)"
              />
              <Field label="Care instructions">
                <textarea
                  value={careInstructions}
                  onChange={(e) => setCareInstructions(e.target.value)}
                  rows={3}
                  placeholder="Optional"
                  className={`${inputCls} border-ink-40 focus:border-ink resize-none`}
                />
              </Field>
            </section>

            {/* Variants */}
            <section className={`${sectionCls} md:col-span-1`}>
              <h2 className={headingCls}>Variants</h2>
              <Field label="Sizes" error={errors.sizes}>
                <div className="flex flex-wrap gap-2">
                  {PRODUCT_SIZES.map((size) => {
                    const selected = sizes.includes(size);
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => {
                          setSizes((prev) =>
                            selected
                              ? prev.filter((s) => s !== size)
                              : [...prev, size],
                          );
                          clearError("sizes");
                        }}
                        className={`rounded-pill font-body border px-3 py-1.5 text-sm transition-colors ${
                          selected
                            ? "border-rose-gold bg-rose-gold text-paper"
                            : "border-ink-40 text-ink hover:border-ink"
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </Field>
              <ChipInput
                label="Colors"
                values={colors}
                onChange={setColors}
                placeholder="Type and press Enter (e.g. Ivory)"
                error={errors.colors}
              />
            </section>

            {/* Organisation */}
            <section className={`${sectionCls} md:col-span-2`}>
              <h2 className={headingCls}>Organisation</h2>
              <Field label="Categories" error={errors.categoryIds}>
                {sortedCategories.length === 0 ? (
                  <p className="font-body text-ink-40 text-sm">
                    No categories available.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {sortedCategories.map((cat) => {
                      const selected = categoryIds.includes(cat.id);
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            setCategoryIds((prev) =>
                              selected
                                ? prev.filter((id) => id !== cat.id)
                                : [...prev, cat.id],
                            );
                            clearError("categoryIds");
                          }}
                          className={`rounded-pill font-body border px-3 py-1.5 text-sm transition-colors ${
                            selected
                              ? "border-rose-gold bg-rose-gold text-paper"
                              : "border-ink-40 text-ink hover:border-ink"
                          }`}
                        >
                          {cat.title}
                          {!cat.isActive && " (inactive)"}
                        </button>
                      );
                    })}
                  </div>
                )}
              </Field>
              <ChipInput
                label="Keywords"
                values={keywords}
                onChange={setKeywords}
                placeholder="Type and press Enter"
              />
            </section>

            {/* Media */}
            <section className={`${sectionCls} md:col-span-3`}>
              <h2 className={headingCls}>Media</h2>
              <ProductGalleryManager
                items={items}
                removed={removed}
                onAddFiles={addGalleryFiles}
                onRemove={removeGalleryItem}
                onRestore={restoreGalleryItem}
                onReorder={reorderGallery}
                maxFiles={MAX_GALLERY}
                disabled={isSaving}
                error={errors.media}
              />

              {isEdit && (
                <div className="border-ink-15 mt-2 flex flex-col gap-3 border-t pt-5">
                  <div className="flex flex-col">
                    <h3 className="font-display text-ink text-lg font-bold">
                      Hero image
                    </h3>
                    <p className="font-body text-ink-40 text-xs">
                      Separate from the gallery — used on the storefront banner.
                    </p>
                  </div>
                  <HeroImageSlot
                    previewUrl={heroPreview ?? heroExistingUrl}
                    onSelect={selectHero}
                    onClear={clearHero}
                    hasPending={heroFile !== null}
                    disabled={isSaving}
                  />
                </div>
              )}
            </section>
          </fieldset>

          {canDelete && (
            <div className="border-rust/40 bg-rust/5 mt-6 flex flex-col gap-3 rounded-xl border p-6">
              <h2 className="font-display text-rust text-xl font-bold">
                Danger zone
              </h2>
              <p className="font-body text-ink-55 text-sm">
                Permanently delete this product and all of its media. This
                cannot be undone.
              </p>
              <button
                type="button"
                onClick={() => {
                  setDeleteInput("");
                  setDeleteOpen(true);
                }}
                className="border-rust font-body text-rust hover:bg-rust hover:text-paper flex w-fit items-center gap-2 rounded-lg border px-4 py-2 text-sm font-bold transition-colors"
              >
                <Trash2 size={16} />
                Delete product
              </button>
            </div>
          )}
        </div>
      </form>

      <div className="border-ink-25 bg-paper sticky bottom-0 z-40 flex items-center justify-end gap-3 border-t px-6 py-3">
        <button
          type="button"
          onClick={handleLeave}
          disabled={isSaving}
          className="border-ink-40 bg-paper font-body text-ink hover:border-ink hover:bg-ink hover:text-paper flex flex-1 items-center justify-center rounded-lg border px-5 py-3.5 text-sm font-bold transition-colors disabled:opacity-50 sm:flex-initial sm:py-2.5"
        >
          Cancel
        </button>
        <button
          type="submit"
          form="product-form"
          disabled={!isDirty || isSaving}
          className="bg-rose-gold font-body text-paper hover:bg-rose-gold-dark flex flex-1 items-center justify-center gap-2 rounded-lg px-5 py-3.5 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 sm:flex-initial sm:py-2.5"
        >
          {isSaving && <Loader2 size={16} className="animate-spin" />}
          {isSaving
            ? isEdit
              ? "Saving…"
              : "Creating…"
            : isEdit
              ? "Save changes"
              : "Create product"}
        </button>
      </div>

      {deleteOpen && (
        <div className="bg-ink/55 fixed inset-0 z-100 flex items-center justify-center p-4">
          <div className="bg-paper shadow-card w-full max-w-md rounded-sm p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-ink text-xl font-bold">
                Delete product
              </h2>
              <button
                type="button"
                onClick={() => setDeleteOpen(false)}
                className="text-ink-40 hover:text-ink"
              >
                <X size={20} />
              </button>
            </div>
            <div className="mb-5 flex gap-4">
              <img
                src={deleteThumb}
                alt={initial?.title ?? ""}
                className="h-20 w-20 rounded-sm object-cover shadow-sm"
              />
              <div className="flex flex-col justify-center">
                <p className="font-body text-ink-55 mb-1 text-sm">
                  This permanently removes the product and all its media.
                </p>
                <p className="font-body text-ink font-semibold">
                  {initial?.title}
                </p>
              </div>
            </div>
            <label className="font-body text-ink-55 mb-2 block text-sm">
              Type <span className="text-ink font-bold">{initial?.title}</span>{" "}
              to confirm.
            </label>
            <input
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              placeholder={initial?.title}
              className="border-ink-25 font-body text-ink focus:border-ink mb-5 w-full rounded-sm border px-3 py-2 focus:outline-none"
            />
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteOpen(false)}
                className="border-ink-25 font-body text-ink hover:bg-ink-05 rounded-sm border px-4 py-2 text-sm font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!deleteReady || isSaving}
                onClick={handleDelete}
                className="bg-rust font-body text-paper rounded-sm px-4 py-2 text-sm font-bold transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
