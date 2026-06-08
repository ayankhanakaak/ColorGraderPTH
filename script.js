                import { Client } from "https://cdn.jsdelivr.net/npm/@gradio/client@latest/dist/index.min.js";

                const fileInput = document.getElementById('file-upload');
                const uploadButtons = document.querySelectorAll('.upload-trigger');
                let mod = document.getElementById('cgmod');
                
                uploadButtons.forEach(b => b.onclick = (e) => {
                    e.preventDefault(); 
                    localStorage.cgOk ? fileInput.click() : mod.style.display='flex';
                });
                
                document.getElementById('cgup').onclick = () => {
                    localStorage.cgOk = 1; 
                    mod.style.display='none'; 
                    fileInput.click();
                };
                
                mod.onclick = (e) => { 
                    if(e.target === mod) mod.style.display = 'none'; 
                };

                const slider = document.getElementById('slider');
                const imgAfter = document.getElementById('img-after');
                const imgBefore = document.querySelector('.img-before');
                const downloadBtn = document.getElementById('download-btn');
				
				downloadBtn.onclick = async (e) => {
					e.preventDefault();
					downloadBtn.innerHTML = "Downloading... ⏳";
					const res = await fetch(downloadBtn.href);
					const blob = await res.blob();
					const link = document.createElement('a');
					link.href = URL.createObjectURL(blob);
					link.download = 'ColorGraderPTH_Enhanced.png';
					link.click();
					downloadBtn.innerHTML = "<i class='fa-solid fa-download'></i> Download Enhanced Image";
				};

                slider.addEventListener('input', (e) => {
                    const value = e.target.value;
                    imgAfter.style.clipPath = `polygon(${value}% 0, 100% 0, 100% 100%, ${value}% 100%)`;
                    e.target.style.background = `linear-gradient(to right, transparent ${value}%, black ${value}%, black ${value}%, transparent ${value}%)`;
                });

                // Send image to AI when uploaded
                fileInput.addEventListener('change', async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;

                    const progContainer = document.getElementById('progress-container');
                    const progBar = document.getElementById('progress-bar');
                    const progText = document.getElementById('progress-text');

                    // Update UI to processing state
                    uploadButtons.forEach(btn => {
                        btn.dataset.originalText = btn.innerText;
                        btn.innerText = "Enhancing... ⏳";
                        btn.style.pointerEvents = "none";
                        btn.style.opacity = "0.7";
                    });
                    
                    downloadBtn.style.display = "none";
                    progContainer.style.display = "block";
                    progBar.style.width = "0%";
                    progText.innerText = "0%";

                    const objectURL = URL.createObjectURL(file);
                    imgBefore.src = objectURL;
                    imgAfter.src = objectURL; // Temporarily display unedited version

					try {
                        // Use the new modern connection method (Make sure your import at the top is 'Client' with a capital C)
                        const app = await Client.connect("AyanKhan07/Space-1");
                        const job = app.submit("/predict", [file]);

                        // Listen to the stream
                        for await (const msg of job) {
                            console.log("SERVER UPDATE:", msg);

                            if (msg.type === "status" && msg.stage === "pending") {
                                progText.innerText = "Queue Position: " + (msg.position || 1) + " - Waiting for server...";
                                continue;
                            }

                            // Backend now streams app-level data as: [processedImage, progressString]
                            // Example progressString values: "0%", "26%", "78%", "100%"
                            if (msg.type !== "data" || !Array.isArray(msg.data)) {
                                continue;
                            }

                            const processedImage = msg.data[0];
                            const progressString = msg.data[1];

                            if (typeof progressString === "string" && progressString.endsWith("%")) {
                                progBar.style.width = progressString;
                                progText.innerText = progressString;
                            }

                            if (processedImage && processedImage.url) {
                                imgAfter.src = processedImage.url;

                                downloadBtn.href = processedImage.url;
                                downloadBtn.style.display = "inline-block";

                                slider.value = 50;
                                slider.dispatchEvent(new Event('input'));
                            }
                        }

                    } catch (error) {
                        console.error("Inference Processing Failure:", error);
                        alert("AI Server is busy or sleeping. Try again later!");
                        imgBefore.src = 'https://blogger.googleusercontent.com/img/a/AVvXsEiksWaGQvsI4mN0cTvFc_kEyHf8Sz7i_i18wdcIAc3-gths0RVcZc487y7me1NKVLgZpDFEzUlxoMcHEAE7szLucp-8VKyPUH7xOIqXGu6bf-ast5YhudRpYh309iI3qDP5BgmdXyBSt-Dh6SY-rX_XcAlKH354AleYX4Kb7hckhTItMxGOleeZPraFW8KJ';
                        imgAfter.src = 'https://blogger.googleusercontent.com/img/a/AVvXsEjyvr7HopTDSZpkoWT3V5PIRbo4X3hMpHDou4IpUDBSkHjxFMcpir7lZ0UniwEmTotoZlhKkwuDvpMAbUgAdg-XLbeF6XbPQ5Ibq_5qsORIld3figQgK_vlEVe6OM15aiW0zdiz0lYqbl9VRe2ETafhrBJZkI6B72sGZN4bwIu9BV-KrtdbzyaOYKOFF3qv';
                    } finally {
                        progContainer.style.display = "none";
                        uploadButtons.forEach(btn => {
                            btn.innerText = btn.dataset.originalText;
                            btn.style.pointerEvents = "auto";
                            btn.style.opacity = "1";
                        });
                    }
                });
