use std::fs;
use std::io::Read;
use std::io::Write;
use std::net::TcpStream;

pub async fn termbin(filepath: String) -> Vec<u8> {
    let file_buf = fs::read(filepath).expect("read_to_string");
    let mut stream = TcpStream::connect(("termbin.com", 9999)).expect("connect");
    stream.write_all(file_buf.as_slice()).expect("write_all");
    let mut stream_reader = stream.try_clone().expect("try_clone");
    let mut client_buffer = [0u8; 1024];
    let read_size = stream_reader.read(&mut client_buffer).expect("read");
    // "https://termbin.com/" is 20 bytes
    if read_size < 20 {
        // TODO: this better!
        panic!("termbin.com upload fail!");
    }
    // (read_size - 2) because termbin.com includes a newline at the end of the returned URL
    return client_buffer[0..(read_size - 2)].to_vec();
}
