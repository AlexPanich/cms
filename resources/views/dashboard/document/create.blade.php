@extends('layouts.dashboard')

@section('title')
    Добавление нового документа
@endsection

@section('scripts.footer')
    <script>
        var token = '{{ csrf_token() }}';
    </script>

    <script src="{{ asset('js/fileuploader.js') }}"></script>
    <script src="{{ asset('js/onload.js') }}"></script>
@endsection

@section('content')
    @include('errors.list')
    <form action="{{ route('add_document') }}" method="post" id="fileloaded">
        {{ csrf_field() }}
        <div class="control-group">
            <label class="control-label" for="title">Title</label>
            <div class="controls">
                <div class="input-prepend">
                    <input name="title" id="title" type="text" class="input-xxlarge" value="{{ old('title') }}"/>
                </div>
            </div>
        </div>
        <br/>
        <div id="message">Select the file:</div>
        <table>
            <td><input type="file" id="files" name="files[]"></td>
            <td>(allowed formats: 'pdf')</td>
        </table>
            <br/>
            <input type="submit"  id="btnSubmit" class="btn btn-success" value="Add"/>
            <br/>
    </form>
    <div class="modal" id="myModal" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">
        <div class="modal-header">
            <h3 id="myModalLabel">Wait for the upload file</h3>
            <p id="cnuploader_progressbar">0</p>
            <p id="cnuploader_progresscomplete"></p>

        </div><div class="modal-footer">
        </div>
    </div>
@endsection