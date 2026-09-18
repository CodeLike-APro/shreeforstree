import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import CategoryEditForm from "./CategoryEditForm";

export const dynamic = "force-dynamic";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const category = await db.query.categories.findFirst({
    where: (categories, { eq }) => eq(categories.slug, slug),
  });

  if (!category) {
    notFound();
  }

  return <CategoryEditForm category={category} />;
}
