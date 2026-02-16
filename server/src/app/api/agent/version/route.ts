import { NextRequest, NextResponse } from "next/server";

const GITHUB_REPO = "Kittisayst/it-help";

// GET /api/agent/version - Returns latest agent version info from GitHub Releases
export async function GET(request: NextRequest) {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`,
      {
        headers: { Accept: "application/vnd.github.v3+json" },
        next: { revalidate: 300 }, // Cache for 5 minutes
      }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch release info" },
        { status: 502 }
      );
    }

    const release = await res.json();

    // Find the zip asset
    const zipAsset = release.assets?.find(
      (a: { name: string }) => a.name === "it-monitor-agent.zip"
    );

    return NextResponse.json({
      version: release.tag_name || "unknown",
      name: release.name || "",
      published_at: release.published_at,
      download_url: zipAsset?.browser_download_url || null,
      release_url: release.html_url,
    });
  } catch (error) {
    console.error("Agent version check error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
