"use client";
import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Camera, X } from "lucide-react";
import type { Product, Category } from "@/types";

const schema = z.object({
  name: z.string().min(2, "Name required"),
  description: z.string().min(4, "Description required"),
  price: z.coerce.number().min(1, "Price required"),
  mrp: z.coerce.number().min(1, "MRP required"),
  unit: z.string().min(1, "Unit required"),
  stock: z.coerce.number().min(0),
  eta: z.coerce.number().min(1),
  category: z.string().min(1, "Category required"),
});
type FormData = z.infer<typeof schema>;

interface Props {
  categories: Category[];
  initial?: Partial<Product>;
  onSave: (data: Omit<Product, "id" | "rating" | "reviews">) => void;
  onCancel: () => void;
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

export default function ProductForm({ categories, initial, onSave, onCancel }: Props) {
  const [imagePreview, setImagePreview] = useState<string>(initial?.image ?? "");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: {
      name: initial?.name ?? "",
      description: initial?.description ?? "",
      price: initial?.price ?? 0,
      mrp: initial?.mrp ?? 0,
      unit: initial?.unit ?? "",
      stock: initial?.stock ?? 0,
      eta: initial?.eta ?? 10,
      category: initial?.category ?? "",
    },
  });

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);

    // Upload to Cloudinary via API route
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.url) setImagePreview(data.url);
    } catch {
      // keep local preview if upload fails
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = (data: FormData) => {
    onSave({ ...data, image: imagePreview, isActive: true });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl p-5 shadow-card"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Image picker */}
        <div className="flex flex-col items-center">
          <div
            onClick={() => fileRef.current?.click()}
            className="relative w-28 h-28 rounded-2xl bg-brand-surface border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer overflow-hidden"
          >
            {imagePreview ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <Camera size={20} className="text-white" />
                </div>
                {uploading && (
                  <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                    <span className="w-5 h-5 border-2 border-brand-green border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center gap-1 text-gray-400">
                <Camera size={24} />
                <span className="text-xs">{uploading ? "Uploading..." : "Add Photo"}</span>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
          <p className="text-xs text-gray-400 mt-1">Tap to upload product image</p>
        </div>

        <Field label="Product Name" error={errors.name?.message}>
          <input {...register("name")} placeholder="e.g. Fresh Tomatoes"
            className="w-full px-4 py-3 rounded-xl bg-brand-surface text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30" />
        </Field>

        <Field label="Description" error={errors.description?.message}>
          <textarea {...register("description")} rows={2} placeholder="Short description..."
            className="w-full px-4 py-3 rounded-xl bg-brand-surface text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 resize-none" />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Selling Price (Rs)" error={errors.price?.message}>
            <input {...register("price")} type="number" placeholder="0"
              className="w-full px-4 py-3 rounded-xl bg-brand-surface text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30" />
          </Field>
          <Field label="MRP (Rs)" error={errors.mrp?.message}>
            <input {...register("mrp")} type="number" placeholder="0"
              className="w-full px-4 py-3 rounded-xl bg-brand-surface text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30" />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Unit" error={errors.unit?.message}>
            <input {...register("unit")} placeholder="e.g. 500g, 1kg, 6 pcs"
              className="w-full px-4 py-3 rounded-xl bg-brand-surface text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30" />
          </Field>
          <Field label="Stock Qty" error={errors.stock?.message}>
            <input {...register("stock")} type="number" placeholder="0"
              className="w-full px-4 py-3 rounded-xl bg-brand-surface text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30" />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Category" error={errors.category?.message}>
            <select {...register("category")}
              className="w-full px-4 py-3 rounded-xl bg-brand-surface text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30">
              <option value="">Select...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>
          <Field label="ETA (mins)" error={errors.eta?.message}>
            <input {...register("eta")} type="number" placeholder="10"
              className="w-full px-4 py-3 rounded-xl bg-brand-surface text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30" />
          </Field>
        </div>

        <div className="flex gap-3 pt-2">
          <motion.button type="submit" whileTap={{ scale: 0.97 }}
            disabled={uploading}
            className="flex-1 py-3.5 rounded-2xl bg-brand-green text-white font-bold shadow-green disabled:opacity-60">
            {initial?.id ? "Save Changes" : "Add Product"}
          </motion.button>
          <button type="button" onClick={onCancel}
            className="w-12 h-12 rounded-2xl bg-brand-surface flex items-center justify-center">
            <X size={18} className="text-gray-500" />
          </button>
        </div>
      </form>
    </motion.div>
  );
}
