// src/lib/donee-types.ts

/**
 * Type definitions untuk semua response API yang dipakai oleh Donee.
 * 
 * Kenapa di-pisah ke file sendiri?
 * - Banyak halaman Donee (browse, detail, favourites, history) pakai type yang sama
 * - Kalau backend ubah field, kita cuma perlu update 1 file
 * - Lebih mudah di-review oleh teammate
 */

/**
 * Fundraising Activity (FRA) yang ditampilkan di list/grid.
 * Sumber: GET /api/donee/fundraising-activities/view-fundraising-activities
 * 
 * Catatan: field seperti targetAmount, imageUrl, location, currentAmount
 * BELUM ADA di backend — akan ditambahkan nanti di Track B.
 * Untuk sekarang kita pakai field yang sudah pasti ada.
 */
export interface FundraisingActivity {
    id: string;
    title: string;
    description: string;
    viewCount: number;
    favouriteCount: number;
    ownerName: string;
    ownerUsername?: string;
    createdAt: string;
    // Fields added in Track B (optional until backend exposes them):
    goalAmount?: number;
    currentAmount?: number;
    status?: string;
    imageUrl?: string | null;
    category?: string;
    location?: string;
  }
  
  /**
   * Detail FRA — sama seperti FundraisingActivity untuk sekarang.
   * Nanti bisa di-extend dengan field tambahan (updates, donor list, dll).
   * Sumber: GET /api/donee/fundraising-activities/view-fundraising-activity/{id}
   */
  export interface FundraisingActivityDetail extends FundraisingActivity {
    // Field tambahan akan ditambah di milestone berikutnya
  }
  
  /**
   * Item di favourite list Donee.
   * Sumber: GET /api/donee/fundraising-activity-favourites/view-my-favourites
   * 
   * Backend kemungkinan return struktur yang sama dengan FundraisingActivity,
   * tapi kita bikin alias supaya semantik-nya jelas.
   */
  export type FavouriteActivity = FundraisingActivity;
  
  /**
   * Donation history milik Donee.
   * Sumber: GET /api/donee/donations/view-my-donations
   */
  export interface DonationHistory {
    id: string;
    amount: string; // BigDecimal dari backend di-serialize jadi string biar precision tidak hilang
    memo: string | null;
    fundraisingActivityId: string;
    fundraisingActivityTitle: string;
    donatedAt: string; // ISO 8601
  }
  
  /**
   * Format error standard dari backend.
   * Pattern yang sama dengan auth-context.tsx kamu.
   */
  export type ApiError = { message: string };