'use server';

import { createClient, createAdminClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function signInAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  redirect('/dashboard');
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

export async function uploadCertificateFileAction(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthenticated.' };
  }

  const file = formData.get('file') as File;
  if (!file) {
    return { error: 'No file provided.' };
  }

  const fileExt = file.name.split('.').pop();
  const sanitizedFilename = file.name
    .replace(/[^a-zA-Z0-9]/g, '_')
    .toLowerCase();
  const filePath = `${user.id}/${Date.now()}_${sanitizedFilename}.${fileExt}`;

  // Convert File to Buffer to ensure robust server-side processing
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error: uploadError } = await supabase.storage
    .from('certificates')
    .upload(filePath, buffer, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    return { error: uploadError.message };
  }

  return { filePath, fileType: file.type };
}

export async function addCertificateAction(data: {
  title: string;
  organization?: string;
  category?: string;
  issueDate?: string;
  filePath: string;
  fileType: string;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthenticated.' };
  }

  const { error } = await supabase.from('certificates').insert({
    user_id: user.id,
    title: data.title,
    organization: data.organization || null,
    category: data.category || null,
    issue_date: data.issueDate || null,
    file_path: data.filePath,
    file_type: data.fileType,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard');
  return { success: true };
}

export async function deleteCertificateAction(id: string, filePath: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthenticated.' };
  }

  // 1. Delete from database
  const { error: dbError } = await supabase
    .from('certificates')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id); // Secure ownership check

  if (dbError) {
    return { error: dbError.message };
  }

  // 2. Delete from Storage bucket
  const { error: storageError } = await supabase.storage
    .from('certificates')
    .remove([filePath]);

  if (storageError) {
    console.error('Storage deletion error:', storageError.message);
    // Continue since the database record is already gone, but log it
  }

  revalidatePath('/dashboard');
  return { success: true };
}

export async function getDownloadUrlAction(filePath: string, filename: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthenticated.' };
  }

  // Generate a signed URL valid for 60 seconds with attachment headers forcing download with filename
  const { data, error } = await supabase.storage
    .from('certificates')
    .createSignedUrl(filePath, 60, {
      download: filename,
    });

  if (error) {
    return { error: error.message };
  }

  return { signedUrl: data.signedUrl };
}

export async function getViewUrlAction(filePath: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthenticated.' };
  }

  // Generate a signed URL for viewing/streaming the file (inline rendering)
  const { data, error } = await supabase.storage
    .from('certificates')
    .createSignedUrl(filePath, 60);

  if (error) {
    return { error: error.message };
  }

  return { signedUrl: data.signedUrl };
}

export async function updateCertificateAction(
  id: string,
  data: {
    title: string;
    organization?: string;
    category?: string;
    issueDate?: string;
  }
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthenticated.' };
  }

  const { error } = await supabase
    .from('certificates')
    .update({
      title: data.title,
      organization: data.organization || null,
      category: data.category || null,
      issue_date: data.issueDate || null,
    })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard');
  return { success: true };
}

export async function getPublicViewUrlAction(filePath: string) {
  const supabaseAdmin = await createAdminClient();

  // Security check: verify the file_path exists in the certificates table
  const { data, error: dbError } = await supabaseAdmin
    .from('certificates')
    .select('id')
    .eq('file_path', filePath)
    .single();

  if (dbError || !data) {
    return { error: 'Access denied: Invalid certificate file.' };
  }

  // Generate signed URL
  const { data: urlData, error: storageError } = await supabaseAdmin.storage
    .from('certificates')
    .createSignedUrl(filePath, 60);

  if (storageError) {
    return { error: storageError.message };
  }

  return { signedUrl: urlData.signedUrl };
}

export async function getPublicDownloadUrlAction(filePath: string, filename: string) {
  const supabaseAdmin = await createAdminClient();

  // Security check: verify the file_path exists in the certificates table
  const { data, error: dbError } = await supabaseAdmin
    .from('certificates')
    .select('id')
    .eq('file_path', filePath)
    .single();

  if (dbError || !data) {
    return { error: 'Access denied: Invalid certificate file.' };
  }

  // Generate signed URL
  const { data: urlData, error: storageError } = await supabaseAdmin.storage
    .from('certificates')
    .createSignedUrl(filePath, 60, {
      download: filename,
    });

  if (storageError) {
    return { error: storageError.message };
  }

  return { signedUrl: urlData.signedUrl };
}

