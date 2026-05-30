"use client";
import { useState } from 'react';

export default function InvitePage() {
    const [formData, setFormData] = useState({ email: '', fullName: '', role: 'RETAILER_ADMIN' });
    const [inviteLink, setInviteLink] = useState('');

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await fetch('/api/admin/invite', {
            method: 'POST',
            body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (data.success) {
            setInviteLink(data.inviteLink);
        }
    };

    return (
        <div className="p-8 max-w-xl mx-auto bg-white rounded-xl shadow-lg border border-gray-200">
            <h1 className="text-2xl font-bold mb-6 text-gray-900">Undang Karyawan Baru</h1>

            <form onSubmit={handleInvite} className="space-y-4">
                <input
                    className="w-full p-3 border rounded-lg"
                    placeholder="Nama Lengkap"
                    onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                />
                <input
                    className="w-full p-3 border rounded-lg"
                    placeholder="Email"
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
                <button className="w-full bg-blue-600 text-white p-3 rounded-lg font-semibold hover:bg-blue-700">
                    Buat Undangan
                </button>
            </form>

            {inviteLink && (
                <div className="mt-6 p-4 bg-gray-50 border-l-4 border-blue-500 rounded">
                    <p className="text-sm font-medium text-gray-700">Link Berhasil Dibuat:</p>
                    <code className="block mt-2 bg-white p-2 border text-blue-600 break-all">{inviteLink}</code>
                    <button
                        onClick={() => navigator.clipboard.writeText(inviteLink)}
                        className="mt-3 text-sm text-blue-700 underline"
                    >
                        Klik untuk Salin Link
                    </button>
                </div>
            )}
        </div>
    );
}