// Decode only mip level 0 of a Basis Universal KTX2 into a binary PPM.
//
// The stock `basisu -unpack` command transcodes every supported GPU format and
// every mip before it writes PNGs. That is useful for validation, but wasteful
// for this sweep's source-image metrics. This helper uses the same official
// transcoder API and emits only the RGBA32 level needed by the metric runner.

#include <cstdint>
#include <fstream>
#include <iostream>
#include <limits>
#include <string>
#include <vector>

#include "basisu_transcoder.h"

namespace {

bool read_file(const std::string& path, std::vector<uint8_t>& data) {
    std::ifstream stream(path, std::ios::binary | std::ios::ate);
    if (!stream) return false;
    const auto size = stream.tellg();
    if (size < 0 || static_cast<uint64_t>(size) > std::numeric_limits<uint32_t>::max()) return false;
    data.resize(static_cast<size_t>(size));
    stream.seekg(0);
    return static_cast<bool>(stream.read(reinterpret_cast<char*>(data.data()), size));
}

}  // namespace

int main(int argc, char** argv) {
    if (argc != 3) {
        std::cerr << "usage: ktx2_decode_level0 INPUT.ktx2 OUTPUT.ppm\n";
        return 2;
    }

    std::vector<uint8_t> file_data;
    if (!read_file(argv[1], file_data)) {
        std::cerr << "failed to read " << argv[1] << "\n";
        return 1;
    }

    basist::basisu_transcoder_init();
    basist::ktx2_transcoder transcoder;
    if (!transcoder.init(file_data.data(), static_cast<uint32_t>(file_data.size()))) {
        std::cerr << "failed to initialize KTX2 transcoder\n";
        return 1;
    }
    if (transcoder.is_hdr()) {
        std::cerr << "HDR KTX2 is unsupported by this LDR metric helper\n";
        return 1;
    }
    if (!transcoder.start_transcoding()) {
        std::cerr << "failed to start transcoding\n";
        return 1;
    }

    const uint32_t width = transcoder.get_width();
    const uint32_t height = transcoder.get_height();
    const auto format = basist::transcoder_texture_format::cTFRGBA32;
    const uint64_t pixel_count_64 = static_cast<uint64_t>(width) * height;
    if (pixel_count_64 > std::numeric_limits<uint32_t>::max()) {
        std::cerr << "decoded image is too large\n";
        return 1;
    }
    const uint32_t pixel_count = static_cast<uint32_t>(pixel_count_64);
    std::vector<uint8_t> rgba(static_cast<size_t>(pixel_count) * 4);
    if (!transcoder.transcode_image_level(0, 0, 0, rgba.data(), pixel_count, format, 0)) {
        std::cerr << "failed to transcode mip level 0 to RGBA32\n";
        return 1;
    }

    std::ofstream out(argv[2], std::ios::binary);
    if (!out) {
        std::cerr << "failed to open " << argv[2] << "\n";
        return 1;
    }
    out << "P6\n" << width << " " << height << "\n255\n";
    std::vector<uint8_t> rgb_row(static_cast<size_t>(width) * 3);
    for (uint32_t y = 0; y < height; ++y) {
        const uint8_t* src = rgba.data() + static_cast<size_t>(y) * width * 4;
        for (uint32_t x = 0; x < width; ++x) {
            rgb_row[x * 3 + 0] = src[x * 4 + 0];
            rgb_row[x * 3 + 1] = src[x * 4 + 1];
            rgb_row[x * 3 + 2] = src[x * 4 + 2];
        }
        out.write(reinterpret_cast<const char*>(rgb_row.data()), static_cast<std::streamsize>(rgb_row.size()));
    }
    if (!out) {
        std::cerr << "failed while writing decoded image\n";
        return 1;
    }
    return 0;
}
