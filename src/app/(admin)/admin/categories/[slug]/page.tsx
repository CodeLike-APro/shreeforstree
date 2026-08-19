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

  return (
    <CategoryEditForm
      category={{
        id: category.id,
        title: category.title,
        slug: category.slug,
        description: category.description,
        categoryImageUrl: category.categoryImageUrl,
        categoryImagePath: category.categoryImagePath,
        sizeChartImageUrl: category.sizeChartImageUrl,
        sizeChartImagePath: category.sizeChartImagePath,
        isActive: category.isActive,
      }}
    />
  );
}
