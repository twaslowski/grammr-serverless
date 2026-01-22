import Link from "next/link";
import {
  Languages,
  User,
  Bell,
  Shield,
  ArrowRight,
  LucideIcon,
  Layers,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { PageLayout } from "@/components/page-header";

interface ProfileNavItem {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  disabled?: boolean;
}

const profileNavItems: ProfileNavItem[] = [
  {
    title: "Language Settings",
    description: "Change your native language and the language you're learning",
    href: "/dashboard/profile/language",
    icon: Languages,
  },
  {
    title: "Flashcards",
    description: "Manage your flashcards and decks",
    href: "/dashboard/profile/flashcards",
    icon: Layers,
  },
  {
    title: "Account",
    description: "Manage your data, export and import flashcards",
    href: "/dashboard/profile/account",
    icon: User,
    disabled: true,
  },
  {
    title: "Notifications",
    description: "Configure email and push notification preferences",
    href: "/dashboard/profile/notifications",
    icon: Bell,
    disabled: true,
  },
  {
    title: "Privacy & Security",
    description: "Manage your data and security settings",
    href: "/dashboard/profile/privacy",
    icon: Shield,
    disabled: true,
  },
];

export default function ProfilePage() {
  return (
    <PageLayout
      header={{
        title: "Profile Settings",
        description:
          "Manage your account, language preferences, and other settings.",
        backHref: "/dashboard",
        backLabel: "Back to Dashboard",
      }}
    >
      <div className="flex-1 w-full flex flex-col gap-6 max-w-4xl">
        <div className="grid gap-4 md:grid-cols-2">
          {profileNavItems.map((item) => (
            <ProfileNavCard key={item.href} item={item} />
          ))}
        </div>
      </div>
    </PageLayout>
  );
}

interface ProfileNavCardProps {
  item: ProfileNavItem;
}

function ProfileNavCard({ item }: ProfileNavCardProps) {
  const Icon = item.icon;

  if (item.disabled) {
    return (
      <Card className="opacity-50 cursor-not-allowed">
        <CardHeader className="flex flex-row items-start gap-4">
          <div className="p-2 bg-muted rounded-lg">
            <Icon className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="flex-1 space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              {item.title}
              <span className="text-xs font-normal text-muted-foreground">
                Coming soon
              </span>
            </CardTitle>
            <CardDescription>{item.description}</CardDescription>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Link href={item.href} className="group">
      <Card className="h-full transition-colors hover:bg-accent/50 hover:border-accent-foreground/20">
        <CardHeader className="flex flex-row items-start gap-4">
          <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              {item.title}
              <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
            </CardTitle>
            <CardDescription>{item.description}</CardDescription>
          </div>
        </CardHeader>
      </Card>
    </Link>
  );
}
