import DOMPurify from 'dompurify';

const TAGS_PERMITIDOS = [
  'a','abbr','b','blockquote','br','caption','cite','code','dd','div','dl','dt',
  'em','figcaption','figure','h1','h2','h3','h4','h5','h6','hr','i','img','li',
  'ol','p','pre','q','s','small','span','strong','sub','sup','table','tbody',
  'td','th','thead','tr','u','ul',
  'svg','circle','rect','path','line','polyline','polygon','ellipse','g','defs',
  'linearGradient','radialGradient','stop','title','desc','text','tspan'
];

const ATRIBUTOS_PERMITIDOS = [
  'href','title','alt','src','class','id','name','target','rel',
  'width','height','colspan','rowspan','start','type','loading','referrerpolicy',
  'viewBox','xmlns','d','cx','cy','r','x','y','x1','y1','x2','y2','rx','ry',
  'fill','stroke','stroke-width','stroke-linecap','stroke-linejoin','stroke-dasharray',
  'points','transform','opacity','offset','stop-color','stop-opacity','fill-rule','clip-rule'
];

const FORBID_TAGS = ['script','iframe','object','embed','form','input','button','style'];
const FORBID_ATTR = ['onerror','onload','onclick','onmouseover','onfocus','onblur','onchange','onsubmit','style'];
const URI_REGEXP = /^(?:(?:https?|mailto|tel|ftp):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i;

export function sanitizarHTML(html: string): string {
  if (!html || typeof html !== 'string') return '';
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: TAGS_PERMITIDOS,
    ALLOWED_ATTR: ATRIBUTOS_PERMITIDOS,
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS,
    FORBID_ATTR,
    ALLOWED_URI_REGEXP: URI_REGEXP
  }) as unknown as string;
}

export function sanitizarTextoConSaltos(texto: string): string {
  if (!texto || typeof texto !== 'string') return '';
  const conBr = texto.replace(/\n/g, '<br>');
  return DOMPurify.sanitize(conBr, {
    ALLOWED_TAGS: ['br'],
    ALLOWED_ATTR: []
  }) as unknown as string;
}
