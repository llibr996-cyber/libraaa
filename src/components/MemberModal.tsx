import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { supabase, type Member } from '../lib/supabase';

interface MemberModalProps {
  member?: Member | null;
  onClose: () => void;
  onSave: () => void;
}

const memberClasses = [
    "Staff", "Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10",
    "Plus One", "Plus Two", "Degree 1st Year", "Degree 2nd Year", "Degree 3rd Year",
    "PG 1st Year", "PG 2nd Year", "Other"
];

const MemberModal: React.FC<MemberModalProps> = ({ member, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    place: '',
    register_number: '',
    class: '',
    address: '',
    membership_type: 'student' as Member['membership_type'],
    status: 'active' as Member['status']
  });
  const [loading, setLoading] = useState(false);
  const [isFetchingId, setIsFetchingId] = useState(false);

  useEffect(() => {
    const fetchNextRegisterNumber = async () => {
      setIsFetchingId(true);
      const { data, error } = await supabase.rpc('get_next_register_number');
      if (error) {
        console.error('Error fetching next register number:', error);
        alert('Could not fetch the next register number.');
      } else {
        setFormData(prev => ({ ...prev, register_number: data }));
      }
      setIsFetchingId(false);
    };

    if (member) {
      setFormData({
        name: member.name,
        email: member.email,
        phone: member.phone || '',
        place: member.place || '',
        register_number: member.register_number || '',
        class: member.class || '',
        address: member.address || '',
        membership_type: member.membership_type,
        status: member.status
      });
    } else {
      // For new members, generate a unique placeholder email and fetch register number
      fetchNextRegisterNumber();
      setFormData(prev => ({
        ...prev,
        name: '',
        phone: '',
        place: '',
        class: '',
        address: '',
        email: `member_${Date.now()}@placeholder.email`,
        membership_type: 'student',
        status: 'active'
      }));
    }
  }, [member]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (member) { // Editing existing member
        const memberData = { ...formData, updated_at: new Date().toISOString() };
        const { error } = await supabase.from('members').update(memberData).eq('id', member.id);
        if (error) throw error;
      } else { // Adding new member
        const { name, place, class: className, register_number, email, membership_type, status } = formData;
        const newMemberData = {
            name,
            place,
            class: className,
            register_number,
            email,
            membership_type,
            status,
            membership_date: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        const { error } = await supabase.from('members').insert(newMemberData);
        if (error) throw error;
      }

      onSave();
    } catch (error) {
      console.error('Error saving member:', error);
      alert('Error saving member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">{member ? 'Edit Member' : 'Add New Member'}</h2>
          <button onClick={onClose}><X /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {!member ? (
            // Simplified form for adding
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Place</label>
                <input type="text" value={formData.place} onChange={(e) => setFormData({ ...formData, place: e.target.value })} className="w-full px-3 py-2 border rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                <select value={formData.class} onChange={(e) => setFormData({ ...formData, class: e.target.value })} className="w-full px-3 py-2 border rounded-md bg-white">
                    <option value="">Select a class</option>
                    {memberClasses.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Register Number</label>
                <div className="relative">
                  <input type="text" readOnly value={formData.register_number} className="w-full px-3 py-2 border rounded-md bg-gray-100" />
                  {isFetchingId && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-400" />}
                </div>
              </div>
            </>
          ) : (
            // Full form for editing
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2 border rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-3 py-2 border rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Place</label>
                  <input type="text" value={formData.place} onChange={(e) => setFormData({ ...formData, place: e.target.value })} className="w-full px-3 py-2 border rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Register Number</label>
                  <input type="text" value={formData.register_number} onChange={(e) => setFormData({ ...formData, register_number: e.target.value })} className="w-full px-3 py-2 border rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                   <select value={formData.class} onChange={(e) => setFormData({ ...formData, class: e.target.value })} className="w-full px-3 py-2 border rounded-md bg-white">
                    <option value="">Select a class</option>
                    {memberClasses.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea rows={3} value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="w-full px-3 py-2 border rounded-md" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Membership Type</label>
                  <select value={formData.membership_type} onChange={(e) => setFormData({ ...formData, membership_type: e.target.value as Member['membership_type'] })} className="w-full px-3 py-2 border rounded-md">
                    <option value="regular">Regular</option>
                    <option value="premium">Premium</option>
                    <option value="student">Student</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as Member['status'] })} className="w-full px-3 py-2 border rounded-md">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>
            </>
          )}
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-100 rounded-md">Cancel</button>
            <button type="submit" disabled={loading || isFetchingId} className="px-4 py-2 bg-purple-600 text-white rounded-md disabled:opacity-50">
              {loading ? 'Saving...' : 'Save Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MemberModal;
