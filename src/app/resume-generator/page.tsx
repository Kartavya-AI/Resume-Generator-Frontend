"use client";

import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { marked } from "marked"; // to render markdown
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
interface ResumeResponse {
    resume: string;
    processing_time: number;
    timestamp: string;
}

export default function ResumeGeneratorPage() {
    const [userInput, setUserInput] = useState<string>("");
    const [result, setResult] = useState<ResumeResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>("");

    // const resumeRef = useRef<HTMLDivElement>(null); 
    const resumeRef = useRef<HTMLDivElement>(null);


    const API_URL =process.env.NEXT_PUBLIC_API_URL;

    const [parsed, setParsed] = useState("");

    useEffect(() => {
        async function convert() {
            if (result?.resume) {
                //  check before using
                const html = await marked(result.resume);
                setParsed(html);
            }
        }
        convert();
    }, [result]);

    /** Handle API Call */
    const handleGenerateResume = async () => {
        if (!userInput.trim()) {
            setError("Please provide your resume details.");
            return;
        }

        setLoading(true);
        setError("");
        setResult(null);

        try {
            const res = await axios.post<ResumeResponse>(`${API_URL}/generate-resume`, {
                user_input: userInput,
            });

            setResult(res.data);
        } catch (err) {
            console.error(err);
            setError("Error connecting to the resume generation API.");
        } finally {
            setLoading(false);
        }
    };

    /** Copy resume text */
    const handleCopy = () => {
        if (result?.resume) {
            navigator.clipboard.writeText(result.resume);
        }
    };

    /** Download as .md */
    const handleDownload = () => {
        if (result?.resume) {
            const blob = new Blob([result.resume], {
                type: "text/plain;charset=utf-8",
            });
            saveAs(blob, "resume.md");
        }
    };

    /** Download as PDF */
    // const handleDownloadPDF = async () => {
    //     if (resumeRef.current) {
    //         const element = resumeRef.current;
    //         const canvas = await html2canvas(element, { scale: 2 });
    //         const imgData = canvas.toDataURL("image/png");

    //         const pdf = new jsPDF("p", "mm", "a4");
    //         const pdfWidth = pdf.internal.pageSize.getWidth();
    //         const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    //         pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    //         pdf.save("resume.pdf");
    //     }
    // };

    const handleDownloadPDF = () => {
        if (!result || !result.resume) {
            alert("No resume content available to export.");
            return;
        }

        const resumeText: string = result.resume;
        const pdf = new jsPDF();
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 10;
        const maxLineWidth = pageWidth - margin * 2;

        const lines: string[] = resumeText.split('\n').map((line) => line ?? "");

        let y = margin;
        const titleFontSize = 14;
        const bodyFontSize = 10;
        const lineHeight = 7;

        lines.forEach((line: string) => {
            const trimmedLine = line.trim();

            if (trimmedLine === "") {
            y += lineHeight;
            return;
            }

            if (trimmedLine.endsWith(":")) {
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(titleFontSize);

            const titleLines = pdf.splitTextToSize(trimmedLine ?? "", maxLineWidth);

            if (y + titleLines.length * lineHeight > pageHeight - margin) {
                pdf.addPage();
                y = margin;
            }

            titleLines.forEach((tLine: string) => {
                pdf.text(tLine ?? "", margin, y);
                y += lineHeight;
            });

            y += lineHeight / 2;

            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(bodyFontSize);
            } else {
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(bodyFontSize);

            const bodyLines = pdf.splitTextToSize(trimmedLine ?? "", maxLineWidth);

            if (y + bodyLines.length * lineHeight > pageHeight - margin) {
                pdf.addPage();
                y = margin;
            }

            bodyLines.forEach((bLine: string) => {
                pdf.text(bLine ?? "", margin, y);
                y += lineHeight;
            });
            }
        });
        pdf.save("resume.pdf");
        };


    return (
        <div className="bg-zinc-100 min-h-screen">
            <div className="max-w-5xl mx-auto p-6 pt-16 space-y-6">
                <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-primary">
                    📝 AI Resume Generator
                </h1>
                <p className="text-gray-600">
                    Generate a polished, professional resume from your raw
                    details using AI.
                </p>

                {/* Input Form */}
                <div className="grid grid-cols-1 gap-4 mt-8">
                    <textarea
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        className="p-3 h-40 bg-zinc-100 shadow-zinc-500 shadow-md inset-shadow-2xs inset-shadow-white rounded-lg"
                        placeholder="Paste your raw resume details here (e.g. name, role, experience, education, skills)..."
                    />
                </div>

                {/* Generate Button */}
                <div className="mt-6">
                    <button
                        onClick={handleGenerateResume}
                        disabled={loading}
                        className="bg-zinc-100 shadow-zinc-500 shadow-md inset-shadow-2xs inset-shadow-white rounded-lg px-6 py-3 text-zinc-700 hover:text-zinc-900 cursor-pointer"
                    >
                        {loading ? "Generating..." : "Generate Resume"}
                    </button>
                </div>

                {error && <p className="text-red-500 font-medium">{error}</p>}

                {/* Output */}
                {result && (
                    <div
                        ref={resumeRef}
                        className="mt-8 p-6 bg-zinc-100 shadow-zinc-500 shadow-md inset-shadow-2xs inset-shadow-white rounded-lg space-y-4"
                    >
                        <h2 className="text-xl font-semibold mb-2">
                            📄 Generated Resume
                        </h2>

                        {/* Render Markdown */}
                        <div
                            className="text-sm md:text-base text-black leading-relaxed space-y-3"
                            dangerouslySetInnerHTML={{ __html: parsed }}
                        />

                        {/* Actions */}
                        <div className="flex gap-4 mt-4">
                            <button
                                onClick={handleCopy}
                                className="px-4 py-2 bg-zinc-100 cursor-pointer shadow-zinc-500 shadow-md inset-shadow-2xs inset-shadow-white rounded-lg hover:shadow-lg"
                            >
                                📋 Copy
                            </button>
                            <button
                                onClick={handleDownload}
                                className="px-4 py-2 bg-zinc-100 shadow-zinc-500 cursor-pointer shadow-md inset-shadow-2xs inset-shadow-white rounded-lg hover:shadow-lg"
                            >
                                ⬇️ Download .md
                            </button>
                             <button
                                onClick={handleDownloadPDF}
                                className="px-4 py-2 bg-zinc-100 shadow-zinc-500 shadow-md cursor-pointer inset-shadow-2xs inset-shadow-white rounded-lg hover:shadow-lg"
                            >
                                📄 Download PDF
                            </button> 
                            


                        </div>

                        <p className="text-xs text-gray-500 mt-2">
                            Generated in {result.processing_time.toFixed(2)}s —{" "}
                            {new Date(result.timestamp).toLocaleString()}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
