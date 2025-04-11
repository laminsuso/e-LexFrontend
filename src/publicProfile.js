export default function PublicProfile() {
  return (
    <div className="w-full flex flex-col gap-[60px]">
      <div className="w-full flex justify-center items-center gap-2 text-[14px] p-[20px] bg-[#cae4fa]">
        <p className="m-0 text-[14px]">Help us spread the word - ⭐</p>
        <a href="/" className="flex underline text-[14px]">
          GitHub
        </a>
      </div>
      <div className="flex flex-col items-center justify-center">
        <div className="w-[75px] h-[75px] rounded-full ring-[2px] ring-offset-2 ring-gray-300 overflow-hidden">
          <img
            className="w-full h-full object-contain"
            src="https://opensign.me/static/media/dp.30e53f135742466a2060.png"
            alt="Profile"
          />
        </div>
        <p className="font-bold uppercase">The Mighty Eagle</p>
        <span className="text-[11px]">newtag</span>
      </div>
      <div className="shadow-sm border-x-[0.1px] border-t-[0.1px] border-gray-250 mt-5 md:mx-40 ">
        <div className="min-h-[300px]">
          <div className="container  bg-white hover:bg-gray-100 p-2 flex justify-between md:items-center border-b-[0.1px]  cursor-pointer border-[#e9e9ea]">
            <div className="flex flex-col px-5 ">
              <p className="font-medium text-[14px]">Docs</p>
              <p className="hidden md:inline-block text-[13px]">
                My New Template
              </p>
            </div>
            <div className="text-[14px] rounded-[20px] hover:text-white hover:bg-[#002864] text-[#002864] border px-[20px] py-[10px] border-[#002864]">
              Sign Now
            </div>
          </div>
        </div>
      </div>
      <div className="p-4 bg-[#dedede] text-base-content rounded  flex flex-col gap-[60px] items-center justify-center">
        <div className="flex gap-4 text-2xl cursor-pointer">
          <a
            href="https://github.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <i className="fab fa-github"></i>
          </a>
          <a
            href="https://www.linkedin.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            <i className="fab fa-linkedin"></i>
          </a>
          <a
            href="https://www.twitter.com/opensignlabs"
            target="_blank"
            rel="noopener noreferrer"
          >
            <i className="fab fa-twitter"></i>
          </a>
          <a
            href="https://discord.com/invite/xe9TDuyAyj"
            target="_blank"
            rel="noopener noreferrer"
          >
            <i className="fab fa-discord"></i>
          </a>
        </div>
        <p className="m-0 text-center">All Rights Reserved © OpenSign™</p>
      </div>
    </div>
  );
}
