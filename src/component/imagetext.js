export default function ImageText({ imgfst, img, head, cont }) {
    return (
        <div className={`flex ${imgfst ? " lg:flex-row-reverse" : "lg:flex-row"} flex-col py-[40px] px-[20px]  lg:gap-[50px] gap-[30px] max-w-[1300px] justify-center`}>
            <div className="flex flex-col gap-[20px] lg:w-[50%]">
                <h1 className="text-[18px] font-bold">{head}</h1>
                <p className="lg:w-[60%]">{cont}</p>
            </div>
            <div className={`img ${imgfst ? "lg:w-[50%]" : "lg:w-[200px]"}  lg:h-[200px] flex justify-center`}>
                <img src={img} alt="img"  className={`${imgfst ? "w-[200px] h-full" : "w-[200px] h-full"}`}/>
            </div>
        </div>

    )
}