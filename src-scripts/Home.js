import React, { useState } from "react";
import HtmlCard from "./components/HtmlCard";
import Editor from "./Editor";

const htmlFiles = [
  { name: "Homepage", file: "index.html" },
  { name: "About", file: "about.html" },
  { name: "Contact", file: "contact.html" },
  { name: "Product", file: "product.html" },
  { name: "Login", file: "login.html" },
  { name: "Register", file: "register.html" },
  {name:"Cart", file:"cart.html"},
  {name:"Checkout", file:"checkout.html"},
 
];

function Home() {
  const [selectedFile, setSelectedFile] = useState("");

  return (
    <div>
      {!selectedFile ? (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "1.5rem",
            justifyContent: "flex-start",
            padding: "1rem 2rem",
          }}
        >
          <h1 style={{ marginBottom: "1rem", marginLeft: "1.3rem" }}>
            HTML Templates
          </h1>
          <div style={{ display: "flex", flexWrap: "wrap" }}>
            {htmlFiles.map(({ name, file }) => (
              <HtmlCard
                key={file}
                title={name}
                src={`/html-pages/${file}`}
                onClick={() => setSelectedFile(file)}
              />
            ))}
          </div>

      
        </div>
      ) : (
        <Editor file={selectedFile} onBack={() => setSelectedFile("")} />
      )}
    </div>
  );
}

export default Home;