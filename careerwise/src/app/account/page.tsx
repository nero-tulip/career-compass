"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth } from "@/app/lib/firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";

export default function AccountPage() {
	const router = useRouter();
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const unsub = onAuthStateChanged(auth, (u) => {
			setUser(u);
			setLoading(false);
		});
		return () => unsub();
	}, []);

		const handleSignOut = async () => {
		setError(null);
		try {
			await signOut(auth);
			router.push("/");
			} catch (e: unknown) {
				const message =
					typeof e === "object" && e !== null && "message" in e
						? String((e as { message?: unknown }).message)
						: undefined;
				setError(message ?? "Failed to sign out");
		}
	};

	if (loading) {
		return (
			<div className="mx-auto max-w-3xl px-4 py-12">
				<div className="animate-pulse h-32 rounded-xl bg-black/5 dark:bg-white/10" />
			</div>
		);
	}

	if (!user) {
		return (
			<div className="mx-auto max-w-3xl px-4 py-12">
				<div className="rounded-xl bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/10 p-6 shadow-sm">
					  <h1 className="text-2xl font-semibold mb-2">You&apos;re not signed in</h1>
					<p className="text-gray-600 dark:text-gray-300 mb-4">
						To view your account details, please create an account or log in.
					</p>
					<div className="flex gap-3">
						<Link href="/signup" className="btn btn-primary">
							Create account
						</Link>
						<Link href="/login" className="btn btn-outline">
							Log in
						</Link>
					</div>
				</div>
			</div>
		);
	}

	const lastSignInTime = user.metadata?.lastSignInTime
		? new Date(user.metadata.lastSignInTime).toLocaleString()
		: "-";
	const creationTime = user.metadata?.creationTime
		? new Date(user.metadata.creationTime).toLocaleString()
		: "-";

	return (
		<div className="mx-auto max-w-3xl px-4 py-12">
			<div className="rounded-xl bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/10 p-6 shadow-sm">
				<div className="flex items-start justify-between gap-4">
					<div>
						<h1 className="text-2xl font-semibold">Your account</h1>
						<p className="text-gray-600 dark:text-gray-300 mt-1">
							Manage your details and sign out.
						</p>
					</div>
					<button onClick={handleSignOut} className="btn btn-outline">
						Sign out
					</button>
				</div>

				{error && (
					<div className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
						{error}
					</div>
				)}

				<div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div className="rounded-lg border border-black/5 dark:border-white/10 p-4 bg-black/2.5 dark:bg-white/5">
						<div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
							Email
						</div>
						<div className="mt-1 font-medium break-all">{user.email ?? "-"}</div>
					</div>
					<div className="rounded-lg border border-black/5 dark:border-white/10 p-4 bg-black/2.5 dark:bg-white/5">
						<div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
							User ID
						</div>
						<div className="mt-1 font-mono text-xs break-all">{user.uid}</div>
					</div>
					<div className="rounded-lg border border-black/5 dark:border-white/10 p-4 bg-black/2.5 dark:bg-white/5">
						<div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
							Last sign-in
						</div>
						<div className="mt-1">{lastSignInTime}</div>
					</div>
					<div className="rounded-lg border border-black/5 dark:border-white/10 p-4 bg-black/2.5 dark:bg-white/5">
						<div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
							Account created
						</div>
						<div className="mt-1">{creationTime}</div>
					</div>
				</div>
			</div>
		</div>
	);
}

