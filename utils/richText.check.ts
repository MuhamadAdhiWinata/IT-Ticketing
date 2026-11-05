// Jalankan: npx tsx utils/richText.check.ts
import assert from 'node:assert';
import { toSafeHtml, isRichTextEmpty } from './richText';

assert.equal(isRichTextEmpty('<p></p>'), true);
assert.equal(isRichTextEmpty('<p>&nbsp; </p>'), true);
assert.equal(isRichTextEmpty('<p>halo</p>'), false);
assert.equal(isRichTextEmpty('<p><img src="/a.png"></p>'), false);
// Teks lama (non-HTML) tetap tampil dan tidak dieksekusi.
assert.equal(toSafeHtml('a < b\nbaris 2'), 'a &lt; b<br>baris 2');
// Tanpa DOM (SSR), HTML di-escape, bukan dirender mentah.
assert.equal(toSafeHtml('<img src=x onerror=alert(1)>'), '&lt;img src=x onerror=alert(1)&gt;');
console.log('richText ok');
