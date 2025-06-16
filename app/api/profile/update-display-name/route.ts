import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const { displayName } = await req.json();
    
    if (!displayName || displayName.trim().length === 0) {
      return NextResponse.json(
        { error: "Display name tidak boleh kosong" },
        { status: 400 }
      );
    }

    if (displayName.trim().length < 2 || displayName.trim().length > 50) {
      return NextResponse.json(
        { error: "Display name harus antara 2-50 karakter" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "User tidak terautentikasi" },
        { status: 401 }
      );
    }

    // Update display name di auth.users metadata
    const { data, error: updateError } = await supabase.auth.updateUser({
      data: { display_name: displayName.trim() }
    });

    if (updateError) {
      console.error("Error updating display name:", updateError);
      return NextResponse.json(
        { error: "Gagal memperbarui display name" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      displayName: displayName.trim(),
      message: "Display name berhasil diperbarui"
    });

  } catch (error: any) {
    console.error("Error in update-display-name API:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}