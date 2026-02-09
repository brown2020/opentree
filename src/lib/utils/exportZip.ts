import JSZip from 'jszip';
import { getDocs, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { exportToGedcom } from './gedcom';
import type { Person, Relationship, Photo, Document as DocType } from '@/lib/types';

/**
 * Export a tree as a ZIP file containing:
 * - tree.ged (GEDCOM file)
 * - photos/{personName}/{filename}
 * - documents/{personName}/{filename}
 */
export async function exportTreeAsZip(
  treeId: string,
  treeName: string,
  persons: Person[],
  relationships: Relationship[]
): Promise<void> {
  const zip = new JSZip();

  // 1. Add GEDCOM file
  const gedcomContent = exportToGedcom(treeName, persons, relationships);
  zip.file('tree.ged', gedcomContent);

  // 2. Collect all photos and documents from Firestore
  const mediaPromises: Promise<void>[] = [];

  for (const person of persons) {
    const personFolder = `${person.firstName}_${person.lastName}`.replace(
      /[^a-zA-Z0-9_-]/g,
      '_'
    );

    // Photos
    mediaPromises.push(
      (async () => {
        try {
          const photosSnapshot = await getDocs(
            collection(db, 'trees', treeId, 'persons', person.id, 'photos')
          );

          for (const photoDoc of photosSnapshot.docs) {
            const data = { id: photoDoc.id, ...photoDoc.data() } as Photo;
            if (!data.url) continue;

            try {
              const response = await fetch(data.url);
              if (!response.ok) continue;

              const blob = await response.blob();
              const fileName = data.caption
                ? `${data.caption.replace(/[^a-zA-Z0-9_-]/g, '_')}_${photoDoc.id}.jpg`
                : `photo_${photoDoc.id}.jpg`;
              zip.file(`photos/${personFolder}/${fileName}`, blob);
            } catch {
              // Skip files that can't be fetched
            }
          }
        } catch {
          // Skip if subcollection doesn't exist
        }
      })()
    );

    // Documents
    mediaPromises.push(
      (async () => {
        try {
          const docsSnapshot = await getDocs(
            collection(db, 'trees', treeId, 'persons', person.id, 'documents')
          );

          for (const docItem of docsSnapshot.docs) {
            const data = { id: docItem.id, ...docItem.data() } as DocType;
            if (!data.url) continue;

            try {
              const response = await fetch(data.url);
              if (!response.ok) continue;

              const blob = await response.blob();
              const ext = data.mimeType === 'application/pdf' ? 'pdf' : 'jpg';
              const fileName = data.name
                ? `${data.name.replace(/[^a-zA-Z0-9_.-]/g, '_')}`
                : `document_${docItem.id}.${ext}`;
              zip.file(`documents/${personFolder}/${fileName}`, blob);
            } catch {
              // Skip files that can't be fetched
            }
          }
        } catch {
          // Skip if subcollection doesn't exist
        }
      })()
    );
  }

  await Promise.all(mediaPromises);

  // 3. Generate and download ZIP
  const content = await zip.generateAsync({ type: 'blob' });

  const safeName = treeName.replace(/[^a-zA-Z0-9_-]/g, '_') || 'family_tree';
  const link = document.createElement('a');
  link.href = URL.createObjectURL(content);
  link.download = `${safeName}_export.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}
