import { redirect } from "next/navigation";
import { DEFAULT_AUTHENTICATED_PATH } from "@/lib/redirect";

// The proxy decides between /boards and /login; this is only a fallback.
export default function Home() {
  redirect(DEFAULT_AUTHENTICATED_PATH);
}
