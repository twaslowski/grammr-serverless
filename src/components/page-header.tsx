import { ReactNode } from "react";
import { ArrowLeft, LucideIcon } from "lucide-react";
import Link from "next/link";

export interface PageHeaderProps {
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
  icon?: LucideIcon;
}

/**
 * Reusable page header component that standardizes the layout
 * of title, description, and optional back button across pages.
 *
 * @example
 * ```tsx
 * <PageHeader
 *   title="Flashcards"
 *   description="Review and manage your flashcards"
 *   backHref="/dashboard"
 *   backLabel="Back to Dashboard"
 * />
 * ```
 */
export function PageHeader({
  title,
  description,
  backHref,
  backLabel = "Back",
  icon: Icon,
}: PageHeaderProps) {
  return (
    <>
      {backHref && (
        <div className="flex items-center gap-4">
          <Link
            href={backHref}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </Link>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          {Icon && <Icon className="h-8 w-8 text-primary" />}
          <h1 className="font-bold text-3xl">{title}</h1>
        </div>
        {description && <p className="text-muted-foreground">{description}</p>}
      </div>
    </>
  );
}

export interface PageLayoutProps {
  children: ReactNode;
  header: PageHeaderProps;
}

/**
 * Wrapper component that combines PageHeader with consistent layout structure.
 * Provides a flex container with proper spacing and max-width.
 *
 * @example
 * ```tsx
 * <PageLayout
 *   header={{
 *     title: "Flashcards",
 *     description: "Review and manage your flashcards",
 *     backHref: "/dashboard",
 *   }}
 * >
 *   <FlashcardList />
 * </PageLayout>
 * ```
 */
export function PageLayout({ children, header }: PageLayoutProps) {
  return (
    <div className="flex-1 w-full flex flex-col gap-6 max-w-4xl">
      <PageHeader {...header} />
      {children}
    </div>
  );
}
