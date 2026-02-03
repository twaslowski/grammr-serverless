import Image from "next/image";

import { signInWithProvider } from "@/app/auth/actions/auth";
import { Button } from "@/components/ui/button";

export const OneTapAuth = () => {
  const signInWithGoogle = signInWithProvider.bind(null, { name: "google" });

  return (
    <div className="flex flex-col mt-4 gap-2">
      <form action={signInWithGoogle}>
        <Button type="submit" className="w-full gap-2">
          <Image
            src="/logos/google.svg"
            width={16}
            height={16}
            alt="google icon"
          />
          <p>Sign up with Google</p>
        </Button>
      </form>
    </div>
  );
};
