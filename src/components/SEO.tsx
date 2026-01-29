import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  name?: string;
  type?: string;
  noindex?: boolean; // New prop to hide private pages
}

export default function SEO({ title, description, name = 'Citadel School', type = 'website', noindex = false }: SEOProps) {
  return (
    <Helmet>
      {/* Standard Metadata */}
      <title>{title}</title>
      <meta name="description" content={description} />
      
      {/* Privacy Control: If noindex is true, tell Google to GO AWAY */}
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Facebook / WhatsApp Sharing (Open Graph) */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content="https://www.citadelofknowledgeinternationalschool-college.com/" /> 
      <meta property="og:image" content="https://www.citadelofknowledgeinternationalschool-college.com/assets/school-logo-fzhk0w0u.png" /> 

      {/* Twitter Sharing */}
      <meta name="twitter:creator" content={name} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
    </Helmet>
  );
}