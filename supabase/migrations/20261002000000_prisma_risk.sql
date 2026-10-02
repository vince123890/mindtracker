-- MIND Tracker prototype — DUMMY pengganti integrasi PRISMA (I-2): risk register per proyek.
-- Bentuk data mengikuti layar Risk PRISMA (Risk Heatmap 5x5, Top Risk, History, Detail Risk).
-- Analysis/[Timeline & Effort] sheet "20% Dashboard & Integrasi": Project indicator, Risk Matrix,
-- Mitigation Status, Risk Aggregate dan Rating. Saat development tabel ini diganti tarikan read-only dari PRISMA.
-- Menggantikan tabel ringkas ext_project_risk (tidak dipakai lagi; rating kini dihitung dari risk register).
-- Data contoh disertakan di file ini agar cukup menjalankan satu file pada database yang sudah di-seed.

create table ext_prisma_risk (
  project_code        text not null,
  risk_id             text not null,                 -- ID risiko di PRISMA (RSK-001)
  top_rank            smallint,                      -- urutan Top Risk; null = bukan top risk
  taxonomy            text not null,                 -- taksonomi risiko PRISMA
  title               text not null,
  description         text not null,
  cause               text not null,
  impact_desc         text not null,
  likelihood          smallint not null check (likelihood between 1 and 5),
  impact              smallint not null check (impact between 1 and 5),
  status              text not null default 'OPEN' check (status in ('OPEN','MITIGATED','CLOSED')),
  mitigation          text,
  mitigation_progress smallint not null default 0 check (mitigation_progress between 0 and 100),
  owner               text,
  last_review         date not null,
  primary key (project_code, risk_id)
);

create table ext_prisma_risk_history (
  project_code    text not null,
  period          date not null,
  open_count      int not null check (open_count >= 0),
  mitigated_count int not null check (mitigated_count >= 0),
  primary key (project_code, period)
);

alter table ext_prisma_risk enable row level security;
alter table ext_prisma_risk_history enable row level security;

-- ============================================================ data dummy
insert into ext_prisma_risk (project_code, risk_id, top_rank, taxonomy, title, description, cause, impact_desc, likelihood, impact, status, mitigation, mitigation_progress, owner, last_review) values
  ('PRJ-ANTAM-001','RSK-001',1,'Operational','Kegagalan persiapan dan pelaksanaan Switch On Furnace','Kegagalan dalam proses persiapan dan pelaksanaan Switch On Furnace pada pabrik FeNi Halmahera Timur.','Prosedur start-up belum diuji penuh dan kesiapan tim operasi belum tervalidasi.','Start-up mundur, target produksi tahun pertama tidak tercapai.',4,3,'OPEN','Simulasi start-up bertahap dan sertifikasi operator furnace.',45,'Kepala Proyek FeNi Haltim','2026-09-20'),
  ('PRJ-ANTAM-001','RSK-002',2,'Supply Chain','Jasa asesmen furnace dan lining repair tidak sesuai','Kualitas dan waktu penyerahan jasa asesmen kondisi furnace dan jasa furnace lining repair tidak sesuai.','Keterbatasan kontraktor spesialis furnace di dalam negeri.','Pekerjaan lining berulang dan jadwal komisioning bergeser.',2,3,'OPEN','Kualifikasi ulang vendor dan klausul penalti keterlambatan.',60,'Manajer Pengadaan','2026-09-18'),
  ('PRJ-ANTAM-001','RSK-003',3,'Engineering','Kualitas material furnace brick tidak sesuai','Kualitas material furnace brick (high-alumina) yang tidak sesuai spesifikasi.','Inspeksi pabrikan tidak menyertakan uji sampel independen.','Umur lining pendek dan risiko kebocoran panas.',3,3,'OPEN','Uji sampel pihak ketiga sebelum pengapalan.',30,'Lead Engineer Furnace','2026-09-15'),
  ('PRJ-ANTAM-001','RSK-004',4,'Financial','Target operasional dan keekonomian tidak tercapai','Ketidakmampuan mencapai target operasional dan keekonomian proyek.','Asumsi harga nikel dan kadar bijih pada studi kelayakan terlalu optimistis.','IRR proyek turun di bawah hurdle rate korporat.',5,3,'OPEN','Kaji ulang model keekonomian setiap kuartal dan skenario harga.',20,'Business Development ANTAM','2026-09-22'),
  ('PRJ-ANTAM-001','RSK-005',5,'Operational','Manajemen dan koordinasi tidak efektif','Manajemen dan koordinasi antar-kontraktor dan pemilik proyek yang tidak efektif.','Interface management belum didefinisikan dalam kontrak.','Keputusan lambat dan pekerjaan ulang di lapangan.',4,2,'OPEN','Rapat koordinasi interface mingguan dan RACI lintas kontraktor.',55,'Project Control Manager','2026-09-19'),
  ('PRJ-ANTAM-001','RSK-006',6,'Engineering','Kegagalan sistem E&I saat uji beban','Kegagalan atau kerusakan sistem E&I, sambungan perpipaan, peralatan kritis (sistem elektroda, pendingin tembaga, sistem perpipaan), kebocoran (tekanan, kenaikan suhu) selama uji beban dan komisioning.','Pre-commissioning check belum lengkap pada sistem kritis.','Kerusakan peralatan kritis dan penundaan komisioning.',3,2,'OPEN','Checklist pre-commissioning per sistem dan uji tekanan bertahap.',40,'Commissioning Manager','2026-09-17'),
  ('PRJ-ANTAM-001','RSK-007',7,'Engineering','Keterlambatan pekerjaan furnace lining repair','Keterlambatan penyelesaian pekerjaan furnace lining repair.','Material refraktori datang terlambat dan tenaga kerja terbatas.','Jalur kritis start-up bergeser.',3,3,'OPEN','Penambahan shift kerja dan stok penyangga refraktori.',35,'Site Manager','2026-09-16'),
  ('PRJ-ANTAM-001','RSK-008',8,'Financial','Pembengkakan anggaran proyek','Pembengkakan anggaran akibat kenaikan harga material, keterlambatan persetujuan izin lingkungan, dan kekurangan teknisi terampil untuk instalasi.','Eskalasi harga baja dan logistik serta antrean perizinan.','Kebutuhan tambahan CAPEX di atas kontinjensi.',4,5,'OPEN','Kontrak harga tetap untuk paket utama dan pemantauan kontinjensi bulanan.',25,'Manajer Keuangan Proyek','2026-09-21'),
  ('PRJ-ANTAM-001','RSK-009',9,'Supply Chain','Keterlambatan pengiriman peralatan','Keterlambatan pengiriman peralatan dari pemasok, cuaca yang memengaruhi jadwal konstruksi, perubahan regulasi, dan penolakan masyarakat setempat.','Pemasok tunggal untuk peralatan long-lead dan musim hujan.','Jadwal konstruksi mundur 2-4 bulan.',4,5,'OPEN','Expediting pabrikan dan rencana kerja musim hujan.',30,'Manajer Pengadaan','2026-09-21'),
  ('PRJ-ANTAM-001','RSK-010',10,'Financial','Gangguan rantai pasok dan fluktuasi kurs','Gangguan rantai pasok akibat isu logistik global dan fluktuasi kurs yang memengaruhi proyek.','Ketergantungan pada peralatan impor dalam USD.','Biaya proyek naik dan arus kas tertekan.',4,5,'OPEN','Hedging valas untuk paket impor utama.',15,'Treasury ANTAM','2026-09-21'),
  ('PRJ-ANTAM-001','RSK-011',null,'Engineering','Keterlambatan fabrikasi long-lead item','Keterlambatan fabrikasi long-lead item (Smelter Furnace Shell).','Kapasitas workshop fabrikator di Tiongkok penuh (overbooked) akibat lonjakan permintaan global.','Jadwal critical path (konstruksi smelter) berpotensi mundur 3-4 bulan, menyebabkan potential loss jutaan USD.',3,4,'OPEN','Pemesanan slot fabrikasi alternatif dan inspeksi progres bulanan.',40,'Lead Engineer Mekanikal','2026-09-14'),
  ('PRJ-ANTAM-001','RSK-012',null,'Financial','Volatilitas kurs Rupiah terhadap USD','Volatilitas kurs Rupiah terhadap Dolar (USD) yang signifikan (>5% dari asumsi FID).','Ketidakpastian ekonomi global dan kebijakan moneter domestik.','Pembengkakan biaya CAPEX (karena 80% peralatan impor dibeli dalam USD) melebihi anggaran FID.',3,4,'OPEN','Kebijakan lindung nilai dan penyesuaian jadwal pembayaran.',35,'Treasury ANTAM','2026-09-14'),
  ('PRJ-ANTAM-001','RSK-013',null,'Compliance','Review IPPKH lebih lama dari jadwal','Proses review IPPKH (Izin Pinjam Pakai Kawasan Hutan) lebih lama dari yang dijadwalkan.','Perubahan birokrasi/pejabat di internal Kementerian LHK yang memperlambat proses review.','Aktivitas land clearing (pembukaan lahan) di area hutan produksi tertunda, mengganggu alur civil work.',3,3,'OPEN','Pendampingan konsultan perizinan dan rapat berkala dengan KLHK.',50,'Manajer Perizinan','2026-09-12'),
  ('PRJ-ANTAM-001','RSK-014',null,'HSE','Kecelakaan kerja pada pekerjaan di ketinggian','Potensi kecelakaan kerja pada pekerjaan di ketinggian saat ereksi struktur baja.','Jumlah pekerjaan paralel tinggi dan pekerja baru.','Cedera serius dan penghentian pekerjaan sementara.',2,4,'MITIGATED','Program permit-to-work dan pengawasan HSE harian.',100,'HSE Manager','2026-09-10'),
  ('PRJ-ANTAM-001','RSK-015',null,'Social','Keberatan masyarakat terhadap jalur angkut','Keberatan masyarakat terhadap jalur angkut material melewati permukiman.','Sosialisasi awal belum menjangkau seluruh desa terdampak.','Penghentian sementara aktivitas angkut.',2,3,'MITIGATED','Jalur angkut alternatif dan program CSR desa terdampak.',100,'Community Relations','2026-09-08'),

  ('PRJ-ANTAM-002','RSK-001',1,'Compliance','Pembebasan lahan perluasan pabrik tertunda','Proses pembebasan lahan perluasan pabrik alumina tahap 2 tertunda.','Sengketa kepemilikan lahan dan negosiasi harga belum selesai.','Konstruksi area digester tidak dapat dimulai sesuai jadwal.',4,4,'OPEN','Pendampingan BPN dan opsi tata letak alternatif.',30,'Manajer Pertanahan','2026-09-19'),
  ('PRJ-ANTAM-002','RSK-002',2,'Supply Chain','Pasokan bauksit dari tambang tidak stabil','Pasokan bauksit dari tambang mitra tidak stabil secara volume dan kadar.','Kontrak pasokan jangka panjang belum ditandatangani.','Utilisasi pabrik di bawah desain pada tahun pertama.',3,4,'OPEN','Negosiasi kontrak take-or-pay dan stok penyangga.',40,'Manajer Rantai Pasok','2026-09-18'),
  ('PRJ-ANTAM-002','RSK-003',3,'HSE','Pengelolaan red mud belum memenuhi baku mutu','Fasilitas penampungan residu bauksit (red mud) belum memenuhi baku mutu terbaru.','Desain mengikuti regulasi lama.','Teguran regulator dan biaya modifikasi fasilitas.',3,5,'OPEN','Kaji ulang desain fasilitas residu dengan konsultan lingkungan.',20,'HSE Manager','2026-09-18'),
  ('PRJ-ANTAM-002','RSK-004',null,'Financial','Kenaikan biaya energi','Kenaikan tarif energi untuk proses kalsinasi.','Penyesuaian harga gas industri.','Biaya operasi per ton alumina naik.',3,3,'OPEN','Studi substitusi bahan bakar.',10,'Manajer Energi','2026-09-15'),
  ('PRJ-ANTAM-002','RSK-005',null,'Engineering','Perubahan desain digester','Perubahan desain digester setelah basic engineering.','Hasil uji bauksit terbaru berbeda dari asumsi awal.','Pekerjaan ulang engineering dan tambahan biaya.',2,3,'MITIGATED','Design freeze dan proses management of change.',100,'Lead Engineer Proses','2026-09-10'),

  ('PRJ-TIMAH-001','RSK-001',1,'Engineering','Integrasi top submerged lance dengan pabrik eksisting','Integrasi teknologi top submerged lance (TSL) dengan fasilitas smelter eksisting.','Dokumentasi as-built fasilitas lama tidak lengkap.','Penyesuaian desain dan shutdown pabrik eksisting lebih lama.',3,4,'OPEN','Survei laser scanning dan rencana tie-in bertahap.',35,'Lead Engineer Smelter','2026-09-17'),
  ('PRJ-TIMAH-001','RSK-002',2,'Operational','Kadar bijih timah menurun','Kadar bijih timah dari tambang laut menurun.','Cadangan dangkal mulai habis.','Umpan smelter tidak mencapai kapasitas desain.',3,3,'OPEN','Program eksplorasi tambahan dan blending.',25,'Manajer Perencanaan Tambang','2026-09-16'),
  ('PRJ-TIMAH-001','RSK-003',null,'Compliance','Perpanjangan izin lingkungan','Perpanjangan persetujuan lingkungan untuk modifikasi smelter.','Perubahan kapasitas memerlukan adendum AMDAL.','Konstruksi menunggu persetujuan.',2,3,'OPEN','Penyusunan adendum AMDAL lebih awal.',60,'Manajer Perizinan','2026-09-12'),
  ('PRJ-TIMAH-001','RSK-004',null,'HSE','Paparan debu dan gas saat tie-in','Paparan debu dan gas pada pekerjaan tie-in di area operasi.','Pekerjaan dilakukan berdampingan dengan unit yang beroperasi.','Gangguan kesehatan pekerja.',2,2,'MITIGATED','Isolasi area dan pemantauan kualitas udara.',100,'HSE Manager','2026-09-05'),

  ('PRJ-PTBA-001','RSK-001',1,'Financial','Kelayakan offtaker DME','Kepastian offtaker DME dan skema harga belum final.','Negosiasi harga patokan dengan offtaker masih berjalan.','Proyek tidak bankable dan FID tertunda.',5,5,'OPEN','Percepatan perjanjian jual beli dan dukungan kebijakan pemerintah.',20,'Direktur Pengembangan PTBA','2026-09-22'),
  ('PRJ-PTBA-001','RSK-002',2,'Financial','Keekonomian proyek sensitif terhadap harga LPG','Keekonomian DME sangat sensitif terhadap harga LPG impor sebagai pembanding.','Harga LPG global berfluktuasi.','IRR proyek di bawah hurdle rate pada skenario harga rendah.',4,5,'OPEN','Analisis sensitivitas dan skema subsidi selisih harga.',15,'Business Development PTBA','2026-09-20'),
  ('PRJ-PTBA-001','RSK-003',3,'Engineering','Teknologi gasifikasi batubara kalori rendah','Kinerja teknologi gasifikasi untuk batubara kalori rendah belum terbukti di skala komersial.','Referensi pabrik sejenis terbatas.','Efisiensi konversi di bawah desain.',3,5,'OPEN','Uji pilot dan jaminan kinerja dari licensor.',30,'Lead Engineer Proses','2026-09-19'),
  ('PRJ-PTBA-001','RSK-004',4,'Compliance','Persyaratan emisi karbon','Persyaratan pelaporan dan batas emisi karbon yang makin ketat.','Kebijakan nilai ekonomi karbon nasional.','Biaya tambahan penangkapan karbon.',4,4,'OPEN','Kajian opsi CCUS dan perdagangan karbon.',10,'HSE Manager','2026-09-18'),
  ('PRJ-PTBA-001','RSK-005',null,'Supply Chain','Ketersediaan EPC kontraktor','Ketersediaan kontraktor EPC berpengalaman untuk proyek gasifikasi.','Pasar kontraktor EPC global padat.','Harga penawaran EPC tinggi.',3,4,'OPEN','Prakualifikasi dini dan paket kontrak terpisah.',25,'Manajer Pengadaan','2026-09-17'),
  ('PRJ-PTBA-001','RSK-006',null,'Social','Penerimaan masyarakat sekitar','Kekhawatiran masyarakat terhadap dampak lingkungan pabrik gasifikasi.','Informasi proyek belum tersosialisasi dengan baik.','Penolakan dan penundaan perizinan lokal.',2,3,'MITIGATED','Program konsultasi publik.',100,'Community Relations','2026-09-09'),

  ('PRJ-INALUM-EPC','RSK-001',1,'Supply Chain','Keterlambatan pengadaan peralatan pot line','Keterlambatan pengadaan peralatan utama pot line.','Pemasok anoda dan rectifier mengalami antrean produksi.','Target COD bergeser.',4,4,'OPEN','Expediting intensif dan pemesanan parsial.',45,'Manajer Pengadaan INALUM','2026-09-21'),
  ('PRJ-INALUM-EPC','RSK-002',2,'Operational','Pasokan listrik untuk pot line baru','Kecukupan pasokan listrik untuk pot line baru.','Penambahan kapasitas pembangkit belum selesai.','Pot line tidak dapat beroperasi penuh.',3,5,'OPEN','Perjanjian pasokan cadangan dengan PLN.',35,'Manajer Energi INALUM','2026-09-20'),
  ('PRJ-INALUM-EPC','RSK-003',3,'Engineering','Kualitas pekerjaan sipil fondasi pot room','Kualitas pekerjaan sipil fondasi pot room tidak sesuai spesifikasi.','Pengawasan mutu subkontraktor lemah.','Perbaikan struktur dan penundaan ereksi.',2,4,'OPEN','Inspeksi mutu pihak ketiga.',60,'Site Manager','2026-09-18'),
  ('PRJ-INALUM-EPC','RSK-004',null,'HSE','Keselamatan kerja pada area bertegangan tinggi','Risiko keselamatan pada pekerjaan di area bertegangan tinggi.','Pekerjaan konstruksi berdekatan dengan pot line yang beroperasi.','Kecelakaan fatal.',2,5,'MITIGATED','Prosedur LOTO dan zona aman.',100,'HSE Manager','2026-09-10'),
  ('PRJ-INALUM-EPC','RSK-005',null,'Financial','Eskalasi biaya konstruksi','Eskalasi biaya material konstruksi.','Kenaikan harga baja dan semen.','Penggunaan kontinjensi di atas rencana.',3,3,'OPEN','Pengendalian change order.',40,'Manajer Keuangan Proyek','2026-09-15');

insert into ext_prisma_risk_history (project_code, period, open_count, mitigated_count) values
  ('PRJ-ANTAM-001','2026-04-01',22,2),('PRJ-ANTAM-001','2026-05-01',20,3),('PRJ-ANTAM-001','2026-06-01',18,6),
  ('PRJ-ANTAM-001','2026-07-01',17,10),('PRJ-ANTAM-001','2026-08-01',15,14),('PRJ-ANTAM-001','2026-09-01',13,16),
  ('PRJ-ANTAM-002','2026-04-01',9,1),('PRJ-ANTAM-002','2026-05-01',9,1),('PRJ-ANTAM-002','2026-06-01',8,2),
  ('PRJ-ANTAM-002','2026-07-01',7,3),('PRJ-ANTAM-002','2026-08-01',6,3),('PRJ-ANTAM-002','2026-09-01',4,4),
  ('PRJ-TIMAH-001','2026-04-01',6,0),('PRJ-TIMAH-001','2026-05-01',5,1),('PRJ-TIMAH-001','2026-06-01',5,1),
  ('PRJ-TIMAH-001','2026-07-01',4,2),('PRJ-TIMAH-001','2026-08-01',4,2),('PRJ-TIMAH-001','2026-09-01',3,3),
  ('PRJ-PTBA-001','2026-04-01',12,1),('PRJ-PTBA-001','2026-05-01',12,1),('PRJ-PTBA-001','2026-06-01',11,2),
  ('PRJ-PTBA-001','2026-07-01',10,3),('PRJ-PTBA-001','2026-08-01',8,3),('PRJ-PTBA-001','2026-09-01',5,4),
  ('PRJ-INALUM-EPC','2026-04-01',10,3),('PRJ-INALUM-EPC','2026-05-01',9,4),('PRJ-INALUM-EPC','2026-06-01',8,5),
  ('PRJ-INALUM-EPC','2026-07-01',7,6),('PRJ-INALUM-EPC','2026-08-01',6,7),('PRJ-INALUM-EPC','2026-09-01',4,8);
